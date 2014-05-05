unipack.js
==========

JavaScript alternative to msgpack that is unicode compatible, ~30% smaller than JSON, but about 2x slower

I have never used this in production, but it comes with some tests.

It compresses numbers about 35% better than JSON, strings 1% and everything
else by almost 100% (undefined, true, false, objects, arrays).

It runs about 2x - 1.5x slower than JSON.
