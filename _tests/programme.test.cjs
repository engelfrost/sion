const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const script = new URL('../assets/js/programme.js', require('node:url').pathToFileURL(__filename));

function programmeAt(instant) {
  let now = Date.parse(instant);
  let onMinute;
  const row = (datetime) => ({ hidden: false, querySelector: () => ({ dateTime: datetime }) });
  const yesterday = row('2026-11-24T23:30');
  const today = row('2026-11-25T09:00');
  const tomorrow = row('2026-11-26T09:00');
  const months = [[yesterday], [today, tomorrow]].map((rows) => ({ hidden: false, querySelectorAll: () => rows }));
  const conference = { hidden: false, dataset: { endDate: '2026-11-25' } };
  const conferences = { hidden: false, querySelectorAll: () => [conference] };
  const empty = { hidden: true };
  const selectors = { '#upcoming-conferences': conferences, '#programme-empty': empty };
  runInNewContext(readFileSync(script, 'utf8'), {
    Date: class extends Date { constructor() { super(now); } static now() { return now; } },
    document: { querySelectorAll: () => months, querySelector: (selector) => selectors[selector], addEventListener() {} },
    setTimeout: (callback) => { onMinute = callback; },
  });
  return { yesterday, today, tomorrow, months, conference, conferences, empty,
    advance(instant) { now = Date.parse(instant); onMinute(); } };
}

test('past dates and empty months are hidden; today stays visible after the event time', () => {
  const { yesterday, today, tomorrow, months, empty } = programmeAt('2026-11-25T22:59:00Z');
  assert.deepEqual([yesterday.hidden, today.hidden, tomorrow.hidden], [true, false, false]);
  assert.deepEqual(months.map((month) => month.hidden), [true, false]);
  assert.equal(empty.hidden, true);
});

test('midnight in Sweden hides the previous day even while the page stays open', () => {
  const page = programmeAt('2026-11-25T22:59:00Z');
  page.advance('2026-11-25T23:00:00Z');
  assert.equal(page.today.hidden, true);
  assert.equal(page.tomorrow.hidden, false);
});

test('a conference stays visible through its final day, then disappears along with its heading', () => {
  const page = programmeAt('2026-11-25T22:59:00Z');
  assert.equal(page.conference.hidden, false);
  assert.equal(page.conferences.hidden, false);
  page.advance('2026-11-25T23:00:00Z');
  assert.equal(page.conference.hidden, true);
  assert.equal(page.conferences.hidden, true);
});

test('a message replaces the programme when no dates remain', () => {
  const page = programmeAt('2026-11-27T10:00:00Z');
  assert.equal(page.empty.hidden, false);
  assert.equal(page.months.every((month) => month.hidden), true);
});
