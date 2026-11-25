(() => {
  const months = [...document.querySelectorAll('.programme-month')];
  const empty = document.querySelector('#programme-empty');
  const conferences = document.querySelector('#upcoming-conferences');
  const swedishDate = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit',
  });

  function hidePast(today, events, dateFor) {
    let hasVisibleEvents = false;
    for (const event of events) {
      const date = dateFor(event);
      event.hidden = /^\d{4}-\d{2}-\d{2}$/.test(date) && date < today;
      if (!event.hidden) hasVisibleEvents = true;
    }
    return !hasVisibleEvents;
  }

  function update() {
    const { year, month, day } = Object.fromEntries(
      swedishDate.formatToParts(new Date()).map(({ type, value }) => [type, value]),
    );
    const today = `${year}-${month}-${day}`;

    for (const month of months) {
      month.hidden = hidePast(today, month.querySelectorAll('li'), (row) =>
        row.querySelector('time[datetime]')?.dateTime.slice(0, 10));
    }
    if (empty) empty.hidden = months.some((month) => !month.hidden);
    if (conferences) {
      conferences.hidden = hidePast(today, conferences.querySelectorAll('.conference'), (card) => card.dataset.endDate);
    }
  }

  function tick() {
    update();
    setTimeout(tick, 60_000 - (Date.now() % 60_000));
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) update();
  });
  tick();
})();
