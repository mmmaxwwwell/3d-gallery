// BEGIN_PARAMS
// Belt height, mm (vertical dimension when worn)
belt_height = 38;
// Belt thickness, mm (front-to-back through the belt)
belt_thick = 4;
// END_PARAMS

wall = 3;
corner_r = 2;
length = 20;
remote_holder_wall = 1.5;
remote_holder_center_spacing = 3;

// Frame: belt runs along Y (threads through the mount lengthwise).
// Belt cross-section in the X-Z plane: belt_thick(X) × belt_height(Z).
// Four external corners live in that X-Z plane; hulled → plate; belt slot cut through Y.

module belt_mount(){
    belt_wrapper();

    difference(){
        translate([remote_holder_wall + belt_thick/2 + remote_holder_center_spacing,0,0])
        remote_holder();
        remote_holder_cutout();
    }
}

module remote_holder_cutout(){
    translate([remote_holder_wall + belt_thick/2 + remote_holder_center_spacing,0,length/2 - remote_holder_wall + -0.175])
    rotate([0,-45,0])
    cube([0.2,length * 2,remote_holder_wall * 1.5], center = true);
}

module remote_holder(){
    cube([remote_holder_wall,length,length], center = true);
    
    translate([-remote_holder_center_spacing/2,0,-length/2])
    cube([remote_holder_wall + remote_holder_center_spacing,length,remote_holder_wall], center = true);

    translate([-remote_holder_center_spacing/2,0,length/2])
    cube([remote_holder_wall + remote_holder_center_spacing,length,remote_holder_wall], center = true);

}

module belt_wrapper() {
    difference() {
        minkowski(){
            cube([belt_thick, length - wall/2, belt_height], center = true);
            sphere(d=wall);
        }
        cube([belt_thick, length * 2, belt_height], center = true);
        

        translate([0,length/3,-belt_height/2])
        cube([belt_thick + wall * 2, 0.4,10], center = true);
        
        translate([0,-length/3,-belt_height/2])
        cube([belt_thick + wall * 2, 0.4,10], center = true);

        translate([5,0,-belt_height/2 + 5])
        rotate([90,0,0])
        cube([belt_thick + wall * 2, 0.4,length/3 * 2 + 0.4], center = true);

        translate([-5,length/3 + 6.67,-belt_height/2 + 5])
        rotate([90,0,0])
        cube([belt_thick + wall * 2, 0.4,length/3 * 2 + 0.4], center = true);

        translate([-5,-length/3 - 6.67,-belt_height/2 + 5])
        rotate([90,0,0])
        cube([belt_thick + wall * 2, 0.4,length/3 * 2 + 0.4], center = true);
    }
}
