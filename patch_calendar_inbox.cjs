const fs = require('fs');
let code = fs.readFileSync('src/components/CalendarView.tsx', 'utf8');

const inboxLogic = `
  const inboxEvents = React.useMemo(() => {
    let list = [...filteredEventsForMe];
    const todayStrForInbox = new Date().toISOString().split("T")[0];
    
    // Sort logic
    if (showPastInbox) {
      // Past events: keep those before today, sort descending (closest past first)
      list = list.filter(e => e.date < todayStrForInbox);
      list.sort((a, b) => b.date.localeCompare(a.date));
    } else {
      // Upcoming events: keep those today or later, sort ascending (closest upcoming first)
      list = list.filter(e => e.date >= todayStrForInbox);
      list.sort((a, b) => a.date.localeCompare(b.date));
    }
    
    return list;
  }, [filteredEventsForMe, showPastInbox]);

  const INBOX_ITEMS_PER_PAGE = 10;
  const totalInboxPages = Math.max(1, Math.ceil(inboxEvents.length / INBOX_ITEMS_PER_PAGE));
  const currentInboxEvents = inboxEvents.slice((inboxPage - 1) * INBOX_ITEMS_PER_PAGE, inboxPage * INBOX_ITEMS_PER_PAGE);

  const unreadCount = filteredEventsForMe.length;
`;

code = code.replace(
  '  const unreadCount = filteredEventsForMe.length;',
  inboxLogic
);

fs.writeFileSync('src/components/CalendarView.tsx', code);
