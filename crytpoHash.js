const MD5 = Ci.nsICryptoHash.MD5;
let str = "now I'm playin' with our cryptoHash library!";

let hasher = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
hasher.init(MD5);
let stream = Cc['@mozilla.org/io/string-input-stream;1']
                .createInstance(Ci.nsIStringInputStream);
stream.setData(str, str.length);

hasher.updateFromStream(stream, stream.available());

hasher.finish(true);


 itG6fYYV7XWI/j6PTJJNUQ==


 gS7bz5WSeu97tp197p9nmA==
