import type { Activity, Process } from '../../data/processes';

interface TimelineProps {
  process: Process;
}

export function Timeline({ process }: TimelineProps) {
  const activities: Activity[] = [...process.activities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const subMap = Object.fromEntries(
    process.subactivities.map(s => [s.id, s.name])
  );

  if (activities.length === 0) {
    return (
      <div className="text-center py-10" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Roboto Condensed', sans-serif" }}>
        No hay actividades registradas aún.
      </div>
    );
  }

  return (
    <div className="relative pl-8">
      {/* Línea vertical dorada */}
      <div
        className="absolute left-3 top-2 bottom-2 w-0.5"
        style={{ background: 'linear-gradient(180deg, #D4AF37 0%, rgba(212,175,55,0.1) 100%)' }}
      />

      <div className="flex flex-col gap-8">
        {activities.map((activity, idx) => (
          <div key={activity.id} className="relative">
            {/* Nodo circular */}
            <div
              className="absolute -left-8 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: '#D4AF37', background: '#134174' }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#D4AF37' }} />
            </div>

            <div
              className="rounded-xl p-4 border"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: idx === 0 ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3
                    className="font-medium"
                    style={{ fontFamily: "'Antonio', sans-serif", fontSize: 16, color: '#fff', lineHeight: 1.2 }}
                  >
                    {activity.title}
                  </h3>
                  <span
                    className="inline-block mt-1 px-2 py-0.5 rounded text-xs"
                    style={{
                      background: 'rgba(0,135,207,0.25)',
                      color: '#0087CF',
                      fontFamily: "'Roboto Condensed', sans-serif",
                      border: '1px solid rgba(0,135,207,0.3)',
                    }}
                  >
                    {subMap[activity.subactivityId] ?? activity.subactivityId}
                  </span>
                </div>
                <span
                  className="shrink-0 text-sm font-medium"
                  style={{ color: '#D4AF37', fontFamily: "'Roboto Condensed', sans-serif" }}
                >
                  {new Date(activity.date + 'T00:00:00').toLocaleDateString('es-CO', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </span>
              </div>

              <p
                className="text-sm mb-2"
                style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Roboto Condensed', sans-serif", lineHeight: 1.5 }}
              >
                {activity.description}
              </p>

              {activity.message && (
                <p
                  className="text-sm italic mb-3"
                  style={{ color: 'rgba(212,175,55,0.8)', fontFamily: "'Roboto Condensed', sans-serif" }}
                >
                  "{activity.message}"
                </p>
              )}

              <div className="flex flex-wrap gap-3 text-xs mb-3">
                <span style={{ color: 'rgba(255,255,255,0.55)', fontFamily: "'Roboto Condensed', sans-serif" }}>
                  <strong style={{ color: '#D4AF37' }}>{activity.attendees}</strong> participantes
                </span>
                {activity.departments.slice(0, 3).map(d => (
                  <span
                    key={d}
                    className="px-2 py-0.5 rounded"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.6)',
                      fontFamily: "'Roboto Condensed', sans-serif",
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Miniaturas de fotos */}
              {activity.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {activity.photos.slice(0, 4).map((photo, i) => (
                    <div
                      key={i}
                      className="w-16 h-16 rounded-lg overflow-hidden border"
                      style={{ borderColor: 'rgba(212,175,55,0.3)' }}
                    >
                      <img
                        src={photo}
                        alt={`Foto ${i + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                  {activity.photos.length > 4 && (
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center border"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderColor: 'rgba(255,255,255,0.15)',
                        fontFamily: "'Antonio', sans-serif",
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 13,
                      }}
                    >
                      +{activity.photos.length - 4}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
