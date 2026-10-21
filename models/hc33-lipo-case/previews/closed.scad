include <../lib/hc33-lipo-case-lib.scad>;
$fn = 40;
color("#1a1a1a") difference() { body(); side_door_printed(); }
color("#1a1a1a") side_door();
color("#ff7a1a") body_tpu();
color("#0a0a0a") body_seal();
color("#3a3a3a") carriage();
color("#ff7a1a") carriage_tpu();
color("#0a0a0a") carriage_seal();
color("#c9a227") ref_sma();
