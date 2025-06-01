global.moment = require("moment-timezone");

const ical = require("node-ical");
const { expect } = require("playwright/test");
const CalendarFetcherUtils = require("../../../../../modules/default/calendar/calendarfetcherutils");

describe("Calendar fetcher utils test", () => {
	const defaultConfig = {
		excludedEvents: [],
		includePastEvents: false,
		maximumEntries: 10,
		maximumNumberOfDays: 365
	};

	describe("filterEvents", () => {
		it("should return only ongoing and upcoming non full day events", () => {
			const minusOneHour = moment().subtract(1, "hours").toDate();
			const minusTwoHours = moment().subtract(2, "hours").toDate();
			const plusOneHour = moment().add(1, "hours").toDate();
			const plusTwoHours = moment().add(2, "hours").toDate();

			const filteredEvents = CalendarFetcherUtils.filterEvents(
				{
					pastEvent: { type: "VEVENT", start: minusTwoHours, end: minusOneHour, summary: "pastEvent" },
					ongoingEvent: { type: "VEVENT", start: minusOneHour, end: plusOneHour, summary: "ongoingEvent" },
					upcomingEvent: { type: "VEVENT", start: plusOneHour, end: plusTwoHours, summary: "upcomingEvent" }
				},
				defaultConfig
			);

			expect(filteredEvents).toHaveLength(2);
			expect(filteredEvents[0].title).toBe("ongoingEvent");
			expect(filteredEvents[1].title).toBe("upcomingEvent");
		});

		it("should return only ongoing and upcoming full day events", () => {
			const yesterday = moment().subtract(1, "days").startOf("day").toDate();
			const today = moment().startOf("day").toDate();
			const tomorrow = moment().add(1, "days").startOf("day").toDate();

			const filteredEvents = CalendarFetcherUtils.filterEvents(
				{
					pastEvent: { type: "VEVENT", start: yesterday, end: yesterday, summary: "pastEvent" },
					ongoingEvent: { type: "VEVENT", start: today, end: today, summary: "ongoingEvent" },
					upcomingEvent: { type: "VEVENT", start: tomorrow, end: tomorrow, summary: "upcomingEvent" }
				},
				defaultConfig
			);

			expect(filteredEvents).toHaveLength(2);
			expect(filteredEvents[0].title).toBe("ongoingEvent");
			expect(filteredEvents[1].title).toBe("upcomingEvent");
		});

		it("should return the correct times when recurring events pass through daylight saving time", () => {
			const data = ical.parseICS(`BEGIN:VEVENT
DTSTART;TZID=Europe/Amsterdam:20250311T090000
DTEND;TZID=Europe/Amsterdam:20250311T091500
RRULE:FREQ=WEEKLY;BYDAY=FR,MO,TH,TU,WE,SA,SU
DTSTAMP:20250531T091103Z
ORGANIZER;CN=test:mailto:test@test.com
UID:67e65a1d-b889-4451-8cab-5518cecb9c66
CREATED:20230111T114612Z
DESCRIPTION:Test
LAST-MODIFIED:20250528T071312Z
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:Test
TRANSP:OPAQUE
END:VEVENT`);

			const filteredEvents = CalendarFetcherUtils.filterEvents(data, defaultConfig);

			const januaryFirst = filteredEvents.filter((event) => moment.unix(event.startDate / 1000).format("MM-DD") === "01-01");
			console.log(januaryFirst);

			const novemberFirst = filteredEvents.filter((event) => moment.unix(event.startDate / 1000).format("MM-DD") === "07-01");
			console.log(novemberFirst);
		});
	});
});
