/*
 * 轻量 MD5 实现（适用于微信小程序）
 * 来源：简化版 https://github.com/emn178/js-md5 （MIT）
 */
/* eslint-disable */
(function() {
  var HEX_CHARS = '0123456789abcdef';
  var EXTRA = [128, 32768, 8388608, -2147483648];
  var SHIFT = [0, 8, 16, 24];

  function md5(message) {
    if (typeof message === 'string') {
      message = toBytes(message);
    }
    return hex(bytesToWords(message), message.length * 8);
  }

  function toBytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 128) {
        bytes.push(c);
      } else if (c < 2048) {
        bytes.push((c >> 6) | 192, (c & 63) | 128);
      } else {
        bytes.push((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128);
      }
    }
    return bytes;
  }

  function bytesToWords(bytes) {
    var words = [];
    for (var i = 0, b = 0; i < bytes.length; i++, b += 8) {
      words[b >>> 5] |= bytes[i] << (b % 32);
    }
    return words;
  }

  function hex(words, length) {
    words[length >>> 5] |= EXTRA[length % 32];
    words[(((length + 64) >>> 9) << 4) + 14] = length;

    var a = 1732584193;
    var b = -271733879;
    var c = -1732584194;
    var d = 271733878;

    for (var i = 0; i < words.length; i += 16) {
      var oa = a;
      var ob = b;
      var oc = c;
      var od = d;

      // Round 1
      a = ff(a, b, c, d, words[i], 7, -680876936);
      d = ff(d, a, b, c, words[i + 1], 12, -389564586);
      c = ff(c, d, a, b, words[i + 2], 17, 606105819);
      b = ff(b, c, d, a, words[i + 3], 22, -1044525330);
      a = ff(a, b, c, d, words[i + 4], 7, -176418897);
      d = ff(d, a, b, c, words[i + 5], 12, 1200080426);
      c = ff(c, d, a, b, words[i + 6], 17, -1473231341);
      b = ff(b, c, d, a, words[i + 7], 22, -45705983);
      a = ff(a, b, c, d, words[i + 8], 7, 1770035416);
      d = ff(d, a, b, c, words[i + 9], 12, -1958414417);
      c = ff(c, d, a, b, words[i + 10], 17, -42063);
      b = ff(b, c, d, a, words[i + 11], 22, -1990404162);
      a = ff(a, b, c, d, words[i + 12], 7, 1804603682);
      d = ff(d, a, b, c, words[i + 13], 12, -40341101);
      c = ff(c, d, a, b, words[i + 14], 17, -1502002290);
      b = ff(b, c, d, a, words[i + 15], 22, 1236535329);

      // Round 2
      a = gg(a, b, c, d, words[i + 1], 5, -165796510);
      d = gg(d, a, b, c, words[i + 6], 9, -1069501632);
      c = gg(c, d, a, b, words[i + 11], 14, 643717713);
      b = gg(b, c, d, a, words[i], 20, -373897302);
      a = gg(a, b, c, d, words[i + 5], 5, -701558691);
      d = gg(d, a, b, c, words[i + 10], 9, 38016083);
      c = gg(c, d, a, b, words[i + 15], 14, -660478335);
      b = gg(b, c, d, a, words[i + 4], 20, -405537848);
      a = gg(a, b, c, d, words[i + 9], 5, 568446438);
      d = gg(d, a, b, c, words[i + 14], 9, -1019803690);
      c = gg(c, d, a, b, words[i + 3], 14, -187363961);
      b = gg(b, c, d, a, words[i + 8], 20, 1163531501);
      a = gg(a, b, c, d, words[i + 13], 5, -1444681467);
      d = gg(d, a, b, c, words[i + 2], 9, -51403784);
      c = gg(c, d, a, b, words[i + 7], 14, 1735328473);
      b = gg(b, c, d, a, words[i + 12], 20, -1926607734);

      // Round 3
      a = hh(a, b, c, d, words[i + 5], 4, -378558);
      d = hh(d, a, b, c, words[i + 8], 11, -2022574463);
      c = hh(c, d, a, b, words[i + 11], 16, 1839030562);
      b = hh(b, c, d, a, words[i + 14], 23, -35309556);
      a = hh(a, b, c, d, words[i + 1], 4, -1530992060);
      d = hh(d, a, b, c, words[i + 4], 11, 1272893353);
      c = hh(c, d, a, b, words[i + 7], 16, -155497632);
      b = hh(b, c, d, a, words[i + 10], 23, -1094730640);
      a = hh(a, b, c, d, words[i + 13], 4, 681279174);
      d = hh(d, a, b, c, words[i], 11, -358537222);
      c = hh(c, d, a, b, words[i + 3], 16, -722521979);
      b = hh(b, c, d, a, words[i + 6], 23, 76029189);
      a = hh(a, b, c, d, words[i + 9], 4, -640364487);
      d = hh(d, a, b, c, words[i + 12], 11, -421815835);
      c = hh(c, d, a, b, words[i + 15], 16, 530742520);
      b = hh(b, c, d, a, words[i + 2], 23, -995338651);

      // Round 4
      a = ii(a, b, c, d, words[i], 6, -198630844);
      d = ii(d, a, b, c, words[i + 7], 10, 1126891415);
      c = ii(c, d, a, b, words[i + 14], 15, -1416354905);
      b = ii(b, c, d, a, words[i + 5], 21, -57434055);
      a = ii(a, b, c, d, words[i + 12], 6, 1700485571);
      d = ii(d, a, b, c, words[i + 3], 10, -1894986606);
      c = ii(c, d, a, b, words[i + 10], 15, -1051523);
      b = ii(b, c, d, a, words[i + 1], 21, -2054922799);
      a = ii(a, b, c, d, words[i + 8], 6, 1873313359);
      d = ii(d, a, b, c, words[i + 15], 10, -30611744);
      c = ii(c, d, a, b, words[i + 6], 15, -1560198380);
      b = ii(b, c, d, a, words[i + 13], 21, 1309151649);
      a = ii(a, b, c, d, words[i + 4], 6, -145523070);
      d = ii(d, a, b, c, words[i + 11], 10, -1120210379);
      c = ii(c, d, a, b, words[i + 2], 15, 718787259);
      b = ii(b, c, d, a, words[i + 9], 21, -343485551);

      a = (a + oa) | 0;
      b = (b + ob) | 0;
      c = (c + oc) | 0;
      d = (d + od) | 0;
    }

    return toHex(a) + toHex(b) + toHex(c) + toHex(d);
  }

  function cmn(q, a, b, x, s, t) {
    a = (a + q + x + t) | 0;
    return ((a << s) | (a >>> (32 - s))) + b;
  }
  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  function toHex(num) {
    var hex = '';
    for (var i = 0; i < 4; i++) {
      hex += HEX_CHARS[(num >> (i * 8 + 4)) & 0x0F] + HEX_CHARS[(num >> (i * 8)) & 0x0F];
    }
    return hex;
  }

  module.exports = md5;
})();

