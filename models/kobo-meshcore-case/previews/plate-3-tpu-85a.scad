include <../lib/kobo-meshcore-case-lib.scad>;
$fn = 40;
color("#222222") translate([-back_x0, 0, 0]) back_gasket();
color("#555555") translate([(case_l - back_x0) / 2, case_w / 2, 0]) usbc_plug();
color("#888888") for (i = [0, 1]) translate([(case_l - back_x0) / 2 - 6 + 12 * i, case_w / 2 + 20, 0]) sma_washer();
