import { test } from "node:test";
import assert from "node:assert/strict";
import { tweetDate, extractTweetText, cleanHandle, decodeEntities } from "../lib/util.js";

test("tweetDate decodes snowflake IDs to correct dates", () => {
  assert.equal(tweetDate("20"), null, "pre-snowflake sequential ID → null");
  assert.equal(tweetDate("200000000000000000").toISOString().slice(0, 10), "2012-05-08");
  assert.equal(tweetDate("600000000000000000").toISOString().slice(0, 10), "2015-05-17");
  assert.equal(tweetDate("1300000000000000000").toISOString().slice(0, 10), "2020-08-30");
  assert.equal(tweetDate("not-a-number"), null);
});

test("cleanHandle normalizes handles and rejects junk", () => {
  assert.equal(cleanHandle("@jack"), "jack");
  assert.equal(cleanHandle("https://twitter.com/NASA/status/123"), "NASA");
  assert.equal(cleanHandle("https://x.com/BarackObama"), "BarackObama");
  assert.equal(cleanHandle("mobile.twitter.com/jack"), null); // no scheme → treated as handle-with-dots → invalid
  assert.equal(cleanHandle("bad handle!"), null);
  assert.equal(cleanHandle(""), null);
  assert.equal(cleanHandle("a".repeat(16)), null); // too long
});

test("extractTweetText pulls og:description", () => {
  const html = `<html><head><meta property="og:description" content="Hello &amp; welcome to 2012"></head></html>`;
  assert.equal(extractTweetText(html), "Hello & welcome to 2012");
  assert.equal(extractTweetText("<html></html>"), null);
});

test("decodeEntities handles named and numeric entities", () => {
  assert.equal(decodeEntities("a &amp; b &#39;c&#39; &#x2764;"), "a & b 'c' ❤");
});
