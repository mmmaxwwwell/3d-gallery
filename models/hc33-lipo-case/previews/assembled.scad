include <../lib/hc33-lipo-case-lib.scad>;
$fn = 40;
// The carriage drawn out to the left with everything on it.
color("#1a1a1a") body();
color("#ff7a1a") body_tpu();
color("#3a3a3a") carriage_out(55) carriage();
color("#ff7a1a") carriage_out(55) carriage_tpu();
color("#2f6fb0") carriage_out(55) ref_tp();
color("#e8c547") carriage_out(55) ref_cell();
color("#2f8f4e") carriage_out(55) ref_hc();
color("#7a3fa0") carriage_out(55) ref_v4();
color("#c9a227") carriage_out(55) ref_sma();
