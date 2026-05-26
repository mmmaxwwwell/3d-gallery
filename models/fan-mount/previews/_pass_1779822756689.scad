
_selected_color_key = "hex:#5fb3d6";

// Build a canonical key string from a color argument the same way the JS
// parser does. Returns the string or "" for unrecognized inputs.
function _color_key(c) =
    is_string(c) ?
        (len(c) > 0 && c[0] == "#" ?
            str("hex:", _lowercase(c))
          : str("name:", _lowercase(c)))
      : is_list(c) ?
            (len(c) == 3 ?
                str("rgba:", c[0], ",", c[1], ",", c[2], ",1")
              : len(c) == 4 ?
                  str("rgba:", c[0], ",", c[1], ",", c[2], ",", c[3])
                : "")
      : "";

function _lowercase(s) = chr([for (i = [0:len(s)-1])
    let(code = ord(s[i]))
    (code >= 65 && code <= 90) ? code + 32 : code]);

// Override built-in color() with a module that masks geometry by selection.
module color(c, alpha = 1) {
    if (_color_key(c) == _selected_color_key) children();
}

include <assembled.scad>;
