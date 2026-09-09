// SPDX-License-Identifier: AGPL-3.0-or-later
package com.mmmaxwwwell.gallery3d;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.util.Log;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Host activity for the 3D Gallery WebView.
 *
 * Loads packages/gallery-app's build output from `assets/webapp/` via
 * `WebViewAssetLoader` so it can be served from a same-origin https URL —
 * a prerequisite for SharedArrayBuffer (COOP/COEP) and Service Workers.
 *
 * Bridges exposed to the WebView (see packages/print-toolkit/src/android-shim-types.ts):
 *   - window.NativeSlicer               (SlicerBridge)
 *   - window.AndroidPrinterDiscovery    (AndroidPrinterDiscoveryBridge)
 *   - window.AndroidFileBridge          (AndroidFileBridgeBridge)
 *   - window.AndroidBackHandler         (BackHandlerBridge, host-internal)
 */
public class MainActivity extends Activity {

    private static final String APP_URL = "https://appassets.androidplatform.net/assets/webapp/index.html";
    private static final String TAG = "Gallery3D";

    // Storage Access Framework request codes: base + auto-incrementing id.
    private static final int REQUEST_OPEN_DOCUMENT_BASE = 0x1000;
    private static final int REQUEST_CREATE_DOCUMENT_BASE = 0x2000;

    private WebView webView;
    private NsdManager nsdManager;
    private WifiManager.MulticastLock multicastLock;
    private final List<NsdServiceInfo> discoveredServices = new ArrayList<>();
    private NsdManager.DiscoveryListener currentDiscoveryListener;

    // Pending SAF operations, keyed by request id.
    private final Map<Integer, String> pendingFileRequests = new HashMap<>();
    // Pending SAF create-document bodies, keyed by request id.
    private final Map<Integer, byte[]> pendingCreateBodies = new HashMap<>();
    private final AtomicInteger safRequestCounter = new AtomicInteger(0);

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        WebView.setWebContentsDebuggingEnabled(true);

        webView = new WebView(this);
        webView.setFitsSystemWindows(true);
        setContentView(webView);

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new CoopCoepAssetsPathHandler(this))
                .build();

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse response = assetLoader.shouldInterceptRequest(request.getUrl());
                if (response != null) {
                    return response;
                }
                return super.shouldInterceptRequest(view, request);
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                String level;
                switch (consoleMessage.messageLevel()) {
                    case ERROR: level = "E"; break;
                    case WARNING: level = "W"; break;
                    default: level = "D"; break;
                }
                Log.println(
                    level.equals("E") ? Log.ERROR : level.equals("W") ? Log.WARN : Log.DEBUG,
                    "WebConsole",
                    consoleMessage.message() + " [" + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber() + "]"
                );
                return true;
            }
        });

        webView.addJavascriptInterface(new AndroidPrinterDiscoveryBridge(), "AndroidPrinterDiscovery");
        webView.addJavascriptInterface(new AndroidFileBridgeBridge(), "AndroidFileBridge");
        webView.addJavascriptInterface(new BackHandlerBridge(), "AndroidBackHandler");

        // Register native slicer bridge if JNI library is available.
        try {
            webView.addJavascriptInterface(new SlicerBridge(webView), "NativeSlicer");
            Log.i(TAG, "Native slicer bridge registered");
        } catch (UnsatisfiedLinkError e) {
            Log.i(TAG, "Native slicer not available (JNI library not present), using WASM fallback");
        }

        nsdManager = (NsdManager) getSystemService(Context.NSD_SERVICE);

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(APP_URL);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        webView.evaluateJavascript(
            "(function() {" +
            "  var e = new Event('androidBackPressed');" +
            "  var handled = !window.dispatchEvent(e);" +
            "  if (!handled && typeof window.__onAndroidBack === 'function') { handled = window.__onAndroidBack(); }" +
            "  if (!handled) { window.AndroidBackHandler.exitApp(); }" +
            "})();",
            null
        );
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        releaseMulticastLock();
    }

    // --- Storage Access Framework result routing ---

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        boolean isOpen = requestCode >= REQUEST_OPEN_DOCUMENT_BASE && requestCode < REQUEST_CREATE_DOCUMENT_BASE;
        boolean isCreate = requestCode >= REQUEST_CREATE_DOCUMENT_BASE;
        if (!isOpen && !isCreate) return;

        String callbackId = pendingFileRequests.remove(requestCode);
        byte[] body = isCreate ? pendingCreateBodies.remove(requestCode) : null;
        if (callbackId == null) return;

        if (resultCode != RESULT_OK || data == null || data.getData() == null) {
            resolveFileBridge(callbackId, null, "cancelled");
            return;
        }

        Uri uri = data.getData();
        try {
            if (isOpen) {
                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                try (InputStream in = getContentResolver().openInputStream(uri)) {
                    if (in == null) {
                        resolveFileBridge(callbackId, null, "openInputStream returned null");
                        return;
                    }
                    byte[] chunk = new byte[8192];
                    int n;
                    while ((n = in.read(chunk)) > 0) buffer.write(chunk, 0, n);
                }
                String base64 = Base64.encodeToString(buffer.toByteArray(), Base64.NO_WRAP);
                resolveFileBridge(callbackId, base64, null);
            } else {
                try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                    if (out == null) {
                        resolveFileBridge(callbackId, null, "openOutputStream returned null");
                        return;
                    }
                    if (body != null) out.write(body);
                }
                resolveFileBridge(callbackId, uri.toString(), null);
            }
        } catch (Exception e) {
            Log.e(TAG, "SAF operation failed", e);
            resolveFileBridge(callbackId, null, e.getMessage() != null ? e.getMessage() : "SAF failure");
        }
    }

    private void resolveFileBridge(String callbackId, String value, String error) {
        String js;
        if (error != null) {
            js = "if(window.___androidFileBridgeReject)window.___androidFileBridgeReject('"
                    + escapeJs(callbackId) + "','" + escapeJs(error) + "')";
        } else {
            js = "if(window.___androidFileBridgeResolve)window.___androidFileBridgeResolve('"
                    + escapeJs(callbackId) + "','" + escapeJs(value != null ? value : "") + "')";
        }
        final String script = js;
        new Handler(Looper.getMainLooper()).post(() -> webView.evaluateJavascript(script, null));
    }

    private static String escapeJs(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r");
    }

    private void acquireMulticastLock() {
        if (multicastLock == null) {
            WifiManager wifiManager = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            multicastLock = wifiManager.createMulticastLock("gallery3d-nsd");
            multicastLock.setReferenceCounted(false);
        }
        multicastLock.acquire();
    }

    private void releaseMulticastLock() {
        if (multicastLock != null && multicastLock.isHeld()) {
            multicastLock.release();
        }
    }

    /**
     * WebViewAssetLoader path handler that decorates responses with
     * COOP/COEP headers so cross-origin isolation is enabled — this is
     * what unlocks SharedArrayBuffer + pthreads for the WASM slicer when
     * the native slicer bridge is absent.
     */
    private static class CoopCoepAssetsPathHandler implements WebViewAssetLoader.PathHandler {
        private final WebViewAssetLoader.AssetsPathHandler delegate;

        CoopCoepAssetsPathHandler(Context context) {
            this.delegate = new WebViewAssetLoader.AssetsPathHandler(context);
        }

        @Override
        public WebResourceResponse handle(String path) {
            WebResourceResponse response = delegate.handle(path);
            if (response == null) return null;
            Map<String, String> headers = response.getResponseHeaders();
            Map<String, String> updated = headers != null ? new HashMap<>(headers) : new HashMap<>();
            updated.put("Cross-Origin-Opener-Policy", "same-origin");
            updated.put("Cross-Origin-Embedder-Policy", "require-corp");
            updated.put("Cross-Origin-Resource-Policy", "same-origin");
            response.setResponseHeaders(updated);
            return response;
        }
    }

    /**
     * `window.AndroidPrinterDiscovery` — matches AndroidPrinterDiscoveryBridge
     * in packages/print-toolkit/src/android-shim-types.ts. Adds an mDNS
     * discovery helper the toolkit consumes via evaluateJavascript.
     */
    private class AndroidPrinterDiscoveryBridge {

        @JavascriptInterface
        public boolean isAvailable() {
            return true;
        }

        @JavascriptInterface
        public boolean allowsCleartextTraffic() {
            return true;
        }

        @JavascriptInterface
        public void discoverPrinters(String callbackName) {
            Log.d(TAG, "Starting mDNS printer discovery");
            discoveredServices.clear();

            acquireMulticastLock();

            String[] serviceTypes = {"_moonraker._tcp.", "_octoprint._tcp.", "_http._tcp."};
            final int[] completedDiscoveries = {0};
            final int totalDiscoveries = serviceTypes.length;

            for (String serviceType : serviceTypes) {
                startDiscovery(serviceType, callbackName, completedDiscoveries, totalDiscoveries);
            }

            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                stopAllDiscovery();
                sendResultsToWebView(callbackName);
            }, 5000);
        }

        private void startDiscovery(String serviceType, String callbackName, int[] completedDiscoveries, int totalDiscoveries) {
            NsdManager.DiscoveryListener listener = new NsdManager.DiscoveryListener() {
                @Override
                public void onStartDiscoveryFailed(String serviceType, int errorCode) {
                    Log.e(TAG, "Discovery start failed for " + serviceType + ": " + errorCode);
                }

                @Override
                public void onStopDiscoveryFailed(String serviceType, int errorCode) {
                    Log.e(TAG, "Discovery stop failed for " + serviceType + ": " + errorCode);
                }

                @Override
                public void onDiscoveryStarted(String serviceType) {
                    Log.d(TAG, "Discovery started for " + serviceType);
                }

                @Override
                public void onDiscoveryStopped(String serviceType) {
                    Log.d(TAG, "Discovery stopped for " + serviceType);
                }

                @Override
                public void onServiceFound(NsdServiceInfo serviceInfo) {
                    Log.d(TAG, "Service found: " + serviceInfo.getServiceName() + " type: " + serviceInfo.getServiceType());
                    synchronized (discoveredServices) {
                        discoveredServices.add(serviceInfo);
                    }
                    nsdManager.resolveService(serviceInfo, new NsdManager.ResolveListener() {
                        @Override
                        public void onResolveFailed(NsdServiceInfo serviceInfo, int errorCode) {
                            Log.e(TAG, "Resolve failed for " + serviceInfo.getServiceName() + ": " + errorCode);
                        }

                        @Override
                        public void onServiceResolved(NsdServiceInfo resolvedInfo) {
                            synchronized (discoveredServices) {
                                for (int i = 0; i < discoveredServices.size(); i++) {
                                    if (discoveredServices.get(i).getServiceName().equals(resolvedInfo.getServiceName())) {
                                        discoveredServices.set(i, resolvedInfo);
                                        break;
                                    }
                                }
                            }
                        }
                    });
                }

                @Override
                public void onServiceLost(NsdServiceInfo serviceInfo) {
                    Log.d(TAG, "Service lost: " + serviceInfo.getServiceName());
                }
            };

            try {
                nsdManager.discoverServices(serviceType, NsdManager.PROTOCOL_DNS_SD, listener);
                synchronized (discoveredServices) {
                    currentDiscoveryListener = listener;
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to start discovery for " + serviceType, e);
            }
        }
    }

    /**
     * `window.AndroidFileBridge` — matches AndroidFileBridge in
     * packages/print-toolkit/src/android-shim-types.ts. Kotlin/JS Promise
     * shape: WebView calls `openFile(mimeTypes)`, host launches SAF,
     * host later invokes window.___androidFileBridgeResolve(id, base64)
     * (or Reject(id, message)); the JS glue in the toolkit wraps this
     * into a Promise it returns to callers.
     *
     * The toolkit's TS surface says openFile/saveFile return Promise<string>.
     * Because @JavascriptInterface can't return a JS Promise directly, the
     * toolkit's runtime shim wraps `openFileNative`/`saveFileNative` in a
     * Promise keyed by callbackId. To keep this bridge callable straight
     * from `window.AndroidFileBridge.openFile(...)` a small JS trampoline
     * is injected by the toolkit on load; see the print-toolkit android
     * shim wiring.
     */
    private class AndroidFileBridgeBridge {
        @JavascriptInterface
        public boolean isAvailable() {
            return true;
        }

        /**
         * Opens the Storage Access Framework file picker.
         * @param mimeTypesJson JSON array of MIME types, e.g. `["application/json"]`
         * @param callbackId    Unique id; result delivered via window.___androidFileBridgeResolve
         */
        @JavascriptInterface
        public void openFile(String mimeTypesJson, String callbackId) {
            int requestCode = REQUEST_OPEN_DOCUMENT_BASE + safRequestCounter.incrementAndGet();
            pendingFileRequests.put(requestCode, callbackId);

            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            String[] mimeTypes = parseMimeTypes(mimeTypesJson);
            if (mimeTypes.length > 0) {
                intent.setType(mimeTypes.length == 1 ? mimeTypes[0] : "*/*");
                if (mimeTypes.length > 1) intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
            } else {
                intent.setType("*/*");
            }

            try {
                startActivityForResult(intent, requestCode);
            } catch (Exception e) {
                Log.e(TAG, "startActivityForResult(OPEN_DOCUMENT) failed", e);
                pendingFileRequests.remove(requestCode);
                resolveFileBridge(callbackId, null, e.getMessage() != null ? e.getMessage() : "no SAF");
            }
        }

        /**
         * Saves bytes to a user-chosen SAF location.
         * @param mimeType      MIME type of the file being saved
         * @param base64Data    Base64-encoded file body
         * @param suggestedName Default filename
         * @param callbackId    Unique id; resolves with content:// URI
         */
        @JavascriptInterface
        public void saveFile(String mimeType, String base64Data, String suggestedName, String callbackId) {
            int requestCode = REQUEST_CREATE_DOCUMENT_BASE + safRequestCounter.incrementAndGet();
            pendingFileRequests.put(requestCode, callbackId);
            try {
                pendingCreateBodies.put(requestCode, Base64.decode(base64Data != null ? base64Data : "", Base64.DEFAULT));
            } catch (IllegalArgumentException e) {
                pendingFileRequests.remove(requestCode);
                resolveFileBridge(callbackId, null, "bad base64");
                return;
            }

            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType(mimeType != null && !mimeType.isEmpty() ? mimeType : "application/octet-stream");
            if (suggestedName != null && !suggestedName.isEmpty()) {
                intent.putExtra(Intent.EXTRA_TITLE, suggestedName);
            }
            try {
                startActivityForResult(intent, requestCode);
            } catch (Exception e) {
                Log.e(TAG, "startActivityForResult(CREATE_DOCUMENT) failed", e);
                pendingFileRequests.remove(requestCode);
                pendingCreateBodies.remove(requestCode);
                resolveFileBridge(callbackId, null, e.getMessage() != null ? e.getMessage() : "no SAF");
            }
        }

        private String[] parseMimeTypes(String json) {
            if (json == null || json.isEmpty()) return new String[0];
            try {
                JSONArray arr = new JSONArray(json);
                String[] out = new String[arr.length()];
                for (int i = 0; i < arr.length(); i++) out[i] = arr.getString(i);
                return out;
            } catch (Exception e) {
                return new String[0];
            }
        }
    }

    private class BackHandlerBridge {
        @JavascriptInterface
        public void exitApp() {
            new Handler(Looper.getMainLooper()).post(() -> MainActivity.super.onBackPressed());
        }
    }

    private void stopAllDiscovery() {
        releaseMulticastLock();
    }

    private void sendResultsToWebView(String callbackName) {
        try {
            JSONArray results = new JSONArray();
            synchronized (discoveredServices) {
                for (NsdServiceInfo info : discoveredServices) {
                    if (info.getHost() == null) continue;
                    JSONObject obj = new JSONObject();
                    obj.put("name", info.getServiceName());
                    obj.put("host", info.getHost().getHostAddress());
                    obj.put("port", info.getPort());
                    obj.put("type", info.getServiceType());
                    results.put(obj);
                }
            }
            final String js = callbackName + "(" + results.toString() + ");";
            Log.d(TAG, "Sending results to WebView: " + js);
            new Handler(Looper.getMainLooper()).post(() -> webView.evaluateJavascript(js, null));
        } catch (Exception e) {
            Log.e(TAG, "Error sending results", e);
        }
    }
}
