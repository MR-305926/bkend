//@ts-check

/**
 * @param {Date} a 
 * @param {Date} b 
 */
function dateIsLesser(a, b) {
    let aa = a.getUTCFullYear();
    let ab = a.getUTCMonth();
    let ac = a.getUTCDate();
    let ad = a.getUTCHours();
    let ae = a.getUTCMinutes();
    let af = a.getUTCSeconds(); 
    let ag = a.getUTCMilliseconds();
    let ba = b.getUTCFullYear();
    let bb = b.getUTCMonth();
    let bc = b.getUTCDate();
    let bd = b.getUTCHours();
    let be = b.getUTCMinutes();
    let bf = b.getUTCSeconds(); 
    let bg = b.getUTCMilliseconds();
    let ans = (aa < ba) && (ab < bb) && (ac < bc) && (ad < bd) && (ac < bc) && (ad < bd) && (ae < be) && (af < bf) && (ag < bg);
    return ans;
}

export default dateIsLesser;