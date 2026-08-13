import ResultLoginGate from '../../../components/result/ResultLoginGate.jsx'
import ResultMascot from '../../../components/mascot/ResultMascot.jsx'
import { parseSajuSections } from '../../../lib/text.js'
import {
  calendarLabel,
  formatBirthDate,
  formatBirthTime,
  genderLabel,
} from '../../profile/profile.js'

function SectionBlock({ section, index }) {
  return (
    <section key={`${section.title || 'body'}-${index}`} className="result-section">
      {section.title && (
        <h3 className="result-section-title">{section.title}</h3>
      )}
      <div className="result-section-body">
        {section.body.split(/\n{2,}/).map((para, paraIndex) => (
          <p key={paraIndex}>{para.trim()}</p>
        ))}
      </div>
    </section>
  )
}

/** 비로그인일 때 앞쪽 절반만 공개합니다. */
function splitForPreview(sections) {
  if (sections.length === 0) return { visible: [], locked: false }

  if (sections.length === 1) {
    const section = sections[0]
    const paras = section.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    if (paras.length <= 1) {
      const text = section.body
      const cut = Math.max(80, Math.ceil(text.length / 2))
      return {
        visible: [{ ...section, body: text.slice(0, cut).trimEnd() }],
        locked: text.length > cut,
      }
    }
    const keep = Math.max(1, Math.ceil(paras.length / 2))
    return {
      visible: [{ ...section, body: paras.slice(0, keep).join('\n\n') }],
      locked: keep < paras.length,
    }
  }

  const keep = Math.max(1, Math.ceil(sections.length / 2))
  return {
    visible: sections.slice(0, keep),
    locked: keep < sections.length,
  }
}

export default function SajuResultView({
  reading,
  resultText,
  locked = false,
  resumePayload = null,
}) {
  const sections = parseSajuSections(resultText)
  const metaBits = [
    formatBirthDate(reading?.birth_date),
    formatBirthTime(reading?.birth_time),
    genderLabel(reading?.gender),
    calendarLabel(reading?.calendar_type),
  ].filter(Boolean)

  const preview = locked ? splitForPreview(sections) : { visible: sections, locked: false }
  const showGate = locked && (preview.locked || sections.length === 0)

  return (
    <div className="result result-view" aria-live="polite">
      <ResultMascot tone="saju" />

      {(reading?.name || metaBits.length > 0) && (
        <header className="result-header">
          {reading?.name && <h2 className="result-name">{reading.name}</h2>}
          {metaBits.length > 0 && (
            <p className="result-meta">{metaBits.join(' · ')}</p>
          )}
        </header>
      )}

      {sections.length > 0 ? (
        <div className={`result-sections${showGate ? ' is-locked' : ''}`}>
          {preview.visible.map((section, index) => (
            <SectionBlock key={`${section.title || 'body'}-${index}`} section={section} index={index} />
          ))}
          {showGate && <ResultLoginGate resumePayload={resumePayload} />}
        </div>
      ) : (
        <div className={`result-plain${showGate ? ' is-locked' : ''}`}>
          <pre className="result-text">
            {locked
              ? String(resultText || '').slice(
                  0,
                  Math.max(120, Math.ceil(String(resultText || '').length / 2)),
                )
              : resultText}
          </pre>
          {showGate && <ResultLoginGate resumePayload={resumePayload} />}
        </div>
      )}

      <p className="result-font-credit">글꼴 · 마루 부리</p>
    </div>
  )
}
