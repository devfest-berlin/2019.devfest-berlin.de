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

module.exports = function() {
  const sessionsRaw = rawData.sessions || {};
  const speakersRaw = rawData.speakers || {};
  const scheduleRaw = rawData.schedule || {};

  const sessions = {};
  const speakers = {};
  const schedule = {};

  for (const [dayKey, day] of Object.entries(scheduleRaw)) {
    const timeslots = [];
    const dayTags = new Set();

    for (let tIndex = 0; tIndex < day.timeslots.length; tIndex++) {
      const ts = day.timeslots[tIndex];
      const slotSessions = [];

      for (let sIndex = 0; sIndex < ts.sessions.length; sIndex++) {
        const itemGroup = ts.sessions[sIndex];
        const subSessions = [];

        for (const sessId of itemGroup.items) {
          const rawSess = sessionsRaw[sessId];
          if (!rawSess) continue;

          (rawSess.tags || []).forEach(t => dayTags.add(t));
          const mainTag = (rawSess.tags && rawSess.tags[0]) || "General";

          const sessionSpeakers = (rawSess.speakers || []).map(spId => {
            const sp = speakersRaw[spId];
            return sp ? {
              id: String(spId),
              name: sp.name,
              photoUrl: normalizeUrl(sp.photoUrl || sp.photo),
              company: sp.company,
              title: sp.title
            } : { id: String(spId), name: spId };
          });

          const track = rawSess.track || (day.tracks && day.tracks[sIndex]) || { title: "General" };

          const finalSession = Object.assign({}, rawSess, {
            id: String(sessId),
            day: dayKey,
            dateReadable: day.dateReadable,
            startTime: ts.startTime,
            endTime: ts.endTime,
            track,
            mainTag,
            speakers: sessionSpeakers
          });

          subSessions.push(finalSession);
          sessions[String(sessId)] = finalSession;

          for (const spId of (rawSess.speakers || [])) {
            const strId = String(spId);
            if (!speakers[strId] && speakersRaw[strId]) {
              speakers[strId] = Object.assign({}, speakersRaw[strId], {
                id: strId,
                photoUrl: normalizeUrl(speakersRaw[strId].photoUrl || speakersRaw[strId].photo),
                socials: (speakersRaw[strId].socials || []).map(soc => Object.assign({}, soc, { link: cleanUrl(soc.link) })),
                sessions: []
              });
            }
            if (speakers[strId]) {
              if (!speakers[strId].sessions) speakers[strId].sessions = [];
              if (!speakers[strId].sessions.some(s => s.id === finalSession.id)) {
                speakers[strId].sessions.push(finalSession);
              }
            }
          }
        }

        slotSessions.push({
          items: subSessions,
          extend: itemGroup.extend || 1,
          trackIndex: sIndex
        });
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
        socials: (sp.socials || []).map(soc => Object.assign({}, soc, { link: cleanUrl(soc.link) })),
        sessions: []
      });
    }
  }

  const speakersList = Object.values(speakers).sort((a, b) => (a.order || 0) - (b.order || 0));
  const featuredSpeakers = speakersList.filter(s => s.featured);
  const sessionsList = Object.values(sessions);

  const team = (rawData.team || []).map(group => Object.assign({}, group, {
    members: (group.members || []).map(m => Object.assign({}, m, {
      photoUrl: normalizeUrl(m.photoUrl || m.photo),
      socials: (m.socials || []).map(soc => Object.assign({}, soc, { link: cleanUrl(soc.link) }))
    }))
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

  return {
    speakers,
    speakersList,
    featuredSpeakers,
    sessions,
    sessionsList,
    schedule,
    daySchedule: schedule["2019-11-09"],
    tracks: scheduleRaw["2019-11-09"] ? scheduleRaw["2019-11-09"].tracks : [],
    team,
    previousSpeakers,
    partners,
    tickets: rawData.tickets || [],
    gallery
  };
};
