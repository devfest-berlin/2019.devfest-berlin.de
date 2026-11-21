const rawData = require("../../docs/default-firebase-data.json");

function normalizeUrl(url) {
  if (!url) return "/images/empty.jpg";
  if (url.startsWith("https://2019.devfest-berlin.de/")) {
    return url.replace("https://2019.devfest-berlin.de/", "/");
  }
  if (url.startsWith("../images/")) {
    return url.replace("../images/", "/images/");
  }
  return url;
}

function cleanUrl(url) {
  if (!url) return "";
  return url.trim().replace(/^https?:\s*\/\//i, (match) => match.toLowerCase().startsWith("https") ? "https://" : "http://");
}

function getDuration(startTime, endTime) {
  if (!startTime || !endTime) return { hh: 0, mm: 0 };
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const diffMins = (eh * 60 + em) - (sh * 60 + sm);
  if (diffMins <= 0) return { hh: 0, mm: 0 };
  return {
    hh: Math.floor(diffMins / 60),
    mm: diffMins % 60
  };
}

function formatDuration(duration) {
  const parts = [];
  if (duration.hh) parts.push(`${duration.hh} hour${duration.hh > 1 ? "s" : ""}`);
  if (duration.mm) parts.push(`${duration.mm} min${duration.mm > 1 ? "s" : ""}`);
  return parts.join(" ");
}

function getSummary(description = "") {
  if (!description) return "";
  const indexes = [
    description.indexOf("\n"),
    description.indexOf("<br"),
    description.length
  ].filter((index) => index > 0);
  return description.slice(0, Math.min(...indexes));
}

function joinParts(parts, sep = " • ") {
  return parts.filter(Boolean).join(sep);
}

module.exports = function() {
  const sessionsRaw = rawData.sessions || {};
  const speakersRaw = rawData.speakers || {};
  const scheduleRaw = rawData.schedule || {};

  const sessions = {};
  const speakers = {};
  const schedule = {};
  const tagFilters = new Set();
  const complexityFilters = new Set();

  for (const [dayKey, day] of Object.entries(scheduleRaw)) {
    const tracksNumber = (day.tracks && day.tracks.length) || 2;
    const timeslots = [];
    const dayTags = new Set();
    const extensions = {};

    for (let tIndex = 0; tIndex < day.timeslots.length; tIndex++) {
      const ts = day.timeslots[tIndex];
      const slotSessions = [];
      const sessionsLen = ts.sessions.length;

      for (let sIndex = 0; sIndex < sessionsLen; sIndex++) {
        const itemGroup = ts.sessions[sIndex];
        const subSessions = [];

        for (const sessId of itemGroup.items) {
          const rawSess = sessionsRaw[sessId];
          if (!rawSess) continue;

          (rawSess.tags || []).forEach(t => {
            const trimmed = t.trim();
            dayTags.add(trimmed);
            tagFilters.add(trimmed);
          });
          if (rawSess.complexity) {
            complexityFilters.add(rawSess.complexity.trim());
          }
          const mainTag = (rawSess.tags && rawSess.tags[0]) || "General";

          const endTime = itemGroup.extend && day.timeslots[tIndex + itemGroup.extend - 1]
            ? day.timeslots[tIndex + itemGroup.extend - 1].endTime
            : ts.endTime;
          const duration = getDuration(ts.startTime, endTime);

          const sessionSpeakers = (rawSess.speakers || []).map(spId => {
            const sp = speakersRaw[spId];
            return sp ? {
              id: String(spId),
              name: sp.name,
              photoUrl: normalizeUrl(sp.photoUrl || sp.photo),
              company: sp.company,
              country: sp.country,
              title: sp.title,
              subtitle: joinParts([sp.company, sp.country], " / ")
            } : { id: String(spId), name: spId };
          });

          const track = rawSess.track || (day.tracks && day.tracks[sIndex]) || { title: "General" };

          const finalSession = Object.assign({}, rawSess, {
            id: String(sessId),
            day: dayKey,
            dateReadable: day.dateReadable,
            startTime: ts.startTime,
            endTime,
            duration,
            durationText: formatDuration(duration),
            summary: getSummary(rawSess.description),
            track,
            mainTag,
            speakers: sessionSpeakers
          });

          subSessions.push(finalSession);
          sessions[String(sessId)] = finalSession;

          for (const spId of (rawSess.speakers || [])) {
            const strId = String(spId);
            if (!speakers[strId] && speakersRaw[strId]) {
              const rawSp = speakersRaw[strId];
              speakers[strId] = Object.assign({}, rawSp, {
                id: strId,
                photoUrl: normalizeUrl(rawSp.photoUrl || rawSp.photo),
                companyLogoUrl: rawSp.companyLogoUrl ? normalizeUrl(rawSp.companyLogoUrl) : "",
                companyInfo: joinParts([rawSp.title, rawSp.company], " • "),
                headerSubtitle: joinParts([rawSp.country, rawSp.pronouns], " • "),
                socials: (rawSp.socials || []).map(soc => Object.assign({}, soc, { link: cleanUrl(soc.link) })),
                sessions: [],
                tags: []
              });
            }
            if (speakers[strId]) {
              if (!speakers[strId].sessions) speakers[strId].sessions = [];
              if (!speakers[strId].sessions.some(s => s.id === finalSession.id)) {
                speakers[strId].sessions.push(finalSession);
              }
              if (!speakers[strId].tags) speakers[strId].tags = [];
              (finalSession.tags || []).forEach(tag => {
                if (!speakers[strId].tags.includes(tag)) speakers[strId].tags.push(tag);
              });
            }
          }
        }

        const start = `${tIndex + 1} / ${sIndex + 1}`;
        const end = `${tIndex + (itemGroup.extend || 0) + 1} / ${
          sessionsLen !== 1
            ? sIndex + 2
            : Object.keys(extensions).length
              ? Object.keys(extensions)[0]
              : tracksNumber + 1
        }`;

        if (itemGroup.extend) {
          extensions[sIndex + 1] = itemGroup.extend;
        }

        slotSessions.push({
          items: subSessions,
          extend: itemGroup.extend || 1,
          trackIndex: sIndex,
          gridArea: `${start} / ${end}`
        });
      }

      for (const [key, value] of Object.entries(extensions)) {
        if (value === 1) {
          delete extensions[key];
        } else {
          extensions[key] = value - 1;
        }
      }

      timeslots.push({
        startTime: ts.startTime,
        endTime: ts.endTime,
        sessions: slotSessions
      });
    }

    schedule[dayKey] = Object.assign({}, day, {
      date: dayKey,
      tags: Array.from(dayTags),
      timeslots
    });
  }

  for (const [id, sp] of Object.entries(speakersRaw)) {
    const strId = String(id);
    if (!speakers[strId]) {
      speakers[strId] = Object.assign({}, sp, {
        id: strId,
        photoUrl: normalizeUrl(sp.photoUrl || sp.photo),
        companyLogoUrl: sp.companyLogoUrl ? normalizeUrl(sp.companyLogoUrl) : "",
        companyInfo: joinParts([sp.title, sp.company], " • "),
        headerSubtitle: joinParts([sp.country, sp.pronouns], " • "),
        socials: (sp.socials || []).map(soc => Object.assign({}, soc, { link: cleanUrl(soc.link) })),
        sessions: [],
        tags: []
      });
    }
  }

  const speakersList = Object.values(speakers).sort((a, b) => (a.order || 0) - (b.order || 0));
  const featuredSpeakers = speakersList.filter(s => s.featured);
  const sessionsList = Object.values(sessions);

  const team = (rawData.team || []).map(group => Object.assign({}, group, {
    members: (group.members || [])
      .map((m, idx) => Object.assign({}, m, {
        _firestoreId: String(idx),
        photoUrl: normalizeUrl(m.photoUrl || m.photo),
        socials: (m.socials || []).map(soc => Object.assign({}, soc, { link: cleanUrl(soc.link) }))
      }))
      .sort((a, b) => (a._firestoreId < b._firestoreId ? -1 : a._firestoreId > b._firestoreId ? 1 : 0))
  }));

  const previousSpeakers = Object.entries(rawData.previousSpeakers || {}).map(([id, s]) => {
    const sessionsObj = s.sessions || {};
    const years = Object.keys(sessionsObj).sort((a, b) => b - a);
    const flatSessions = [];
    for (const year of years) {
      for (const sess of (sessionsObj[year] || [])) {
        flatSessions.push(Object.assign({}, sess, { year }));
      }
    }
    return Object.assign({}, s, {
      id,
      photoUrl: normalizeUrl(s.photoUrl || s.photo),
      companyInfo: joinParts([s.title, s.company], ", "),
      socials: (s.socials || []).map(soc => Object.assign({}, soc, { link: cleanUrl(soc.link) })),
      yearsFormatted: years.join(', '),
      flatSessions
    });
  }).sort((a, b) => (a.order || 0) - (b.order || 0));

  const partners = (rawData.partners || []).map(group => Object.assign({}, group, {
    logos: (group.logos || []).map(l => Object.assign({}, l, {
      logoUrl: normalizeUrl(l.logoUrl)
    }))
  }));

  const gallery = (rawData.gallery || []).map(url => normalizeUrl(url));
  const tickets = rawData.tickets || [];
  const availableTicket = tickets.find(t => t.available);
  const buyTicketUrl = availableTicket ? availableTicket.url : (tickets[0] ? tickets[0].url : "/#tickets");

  return {
    speakers,
    speakersList,
    featuredSpeakers,
    sessions,
    sessionsList,
    schedule,
    daySchedule: schedule["2019-11-09"],
    tracks: scheduleRaw["2019-11-09"] ? scheduleRaw["2019-11-09"].tracks : [],
    filters: {
      tags: Array.from(tagFilters).sort(),
      complexity: Array.from(complexityFilters)
    },
    team,
    previousSpeakers,
    partners,
    tickets,
    buyTicketUrl,
    gallery
  };
};
