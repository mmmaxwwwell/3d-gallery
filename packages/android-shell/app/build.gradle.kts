// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Android shell for @3d-gallery/gallery-app.
//
// Runs `npm run build -w @3d-gallery/gallery-app` at the workspace root as
// a preBuild dependency, then copies the resulting dist/ into
// app/src/main/assets/webapp/ so WebViewAssetLoader can serve it from
// https://appassets.androidplatform.net/assets/webapp/…

plugins {
    id("com.android.application")
}

// Workspace root sits two directories above packages/android-shell/.
val workspaceRoot = file("${project.rootDir}/../..")
val galleryAppDist = file("${workspaceRoot}/packages/gallery-app/dist")

val buildGalleryApp by tasks.registering(Exec::class) {
    workingDir = workspaceRoot
    commandLine("npm", "run", "build", "-w", "@3d-gallery/gallery-app")
    inputs.files(fileTree(workspaceRoot) {
        include(
            "packages/gallery-app/src/**",
            "packages/gallery-app/public/**",
            "packages/gallery-app/index.html",
            "packages/gallery-app/vite.config.ts",
            "packages/gallery-app/package.json",
            "packages/gallery-app/tsconfig.json",
            "packages/print-toolkit/src/**",
            "packages/print-toolkit/package.json",
            "models/**",
        )
    })
    outputs.dir(galleryAppDist)
}

val copyGalleryAppAssets by tasks.registering(Copy::class) {
    dependsOn(buildGalleryApp)
    from(galleryAppDist)
    into("src/main/assets/webapp")
}

tasks.named("preBuild") {
    dependsOn(copyGalleryAppAssets)
}

android {
    namespace = "com.mmmaxwwwell.gallery3d"
    compileSdk = 35
    ndkVersion = "26.1.10909125"

    defaultConfig {
        applicationId = "com.mmmaxwwwell.gallery3d"
        minSdk = 24
        targetSdk = 35
        versionCode = System.getenv("VERSION_CODE")?.toIntOrNull() ?: 1
        versionName = System.getenv("VERSION_NAME") ?: "1.0.0"

        ndk {
            abiFilters += listOf("arm64-v8a", "armeabi-v7a")
        }

        externalNativeBuild {
            cmake {
                cppFlags += "-std=c++17"
                arguments += "-DANDROID_STL=c++_shared"
            }
        }
    }

    // Only enable native build if jniLibs contain prebuilt libslic3r.so.
    // The Nix package `orcaslicer-android-arm64` (see OWG flake) produces
    // this shared library. When absent the WebView falls back to the
    // WASM slicer served alongside gallery-app.
    val hasNativeLibs = file("src/main/jniLibs/arm64-v8a/libslic3r.so").exists()
    if (hasNativeLibs) {
        externalNativeBuild {
            cmake {
                path = file("src/main/jni/CMakeLists.txt")
                version = "3.22.1+"
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

configurations.all {
    resolutionStrategy {
        force("org.jetbrains.kotlin:kotlin-stdlib:1.8.22")
        force("org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22")
        force("org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22")
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.webkit:webkit:1.12.1")
}
