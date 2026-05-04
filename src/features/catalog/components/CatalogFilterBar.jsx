import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { FILTER_AXES, countActiveFilters } from '../data/filters'

function FilterDropdown({ axis, selected, onToggle, onClear }) {
  const { lang, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    const escHandler = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', escHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', escHandler)
    }
  }, [open])

  const label = lang === 'en' ? axis.labelEn : axis.label
  const placeholder = t('catalog.selectPlaceholder', 'Seleccionar o tipear')

  const selectedLabels = selected
    .map((id) => {
      const opt = axis.options.find((o) => o.id === id)
      return opt ? (lang === 'en' ? opt.labelEn : opt.label) : null
    })
    .filter(Boolean)

  return (
    <div ref={ref} className="relative">
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-[#cfd4dc]">
          {label}
        </label>
        {selected.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-[12px] leading-none" aria-hidden="true">close</span>
            {t('catalog.filterClear', 'Limpiar')}
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-12 w-full items-center justify-between gap-2 border bg-[#0b0b0b] px-3.5 text-left transition ${
          open ? 'border-primary' : 'border-[#2a2d33] hover:border-primary/55'
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex-1 truncate text-[0.85rem]">
          {selectedLabels.length === 0 ? (
            <span className="text-[#6f7480]">{placeholder}</span>
          ) : (
            <span className="text-white">{selectedLabels.join(', ')}</span>
          )}
        </span>
        <span
          className={`material-symbols-outlined text-[20px] text-primary transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          expand_more
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 right-0 top-[calc(100%-1px)] z-30 max-h-[280px] overflow-y-auto border border-primary bg-[#0b0b0b] shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
        >
          {axis.options.map((opt) => {
            const isSelected = selected.includes(opt.id)
            const optLabel = lang === 'en' ? opt.labelEn : opt.label
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onToggle(opt.id)}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[0.82rem] transition ${
                  isSelected
                    ? 'bg-[rgba(244,223,51,0.13)] text-white'
                    : 'text-[#cfd4dc] hover:bg-[rgba(244,223,51,0.06)] hover:text-white'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center border ${
                    isSelected ? 'border-primary bg-primary' : 'border-[#3a3d42]'
                  }`}
                >
                  {isSelected ? (
                    <span className="material-symbols-outlined text-[10px] leading-none text-[#0b0b0b]">check</span>
                  ) : null}
                </span>
                {optLabel}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function CatalogFilterBar({ activeFilters, onChange }) {
  const { t } = useLanguage()

  const toggleOption = (axisId, optionId) => {
    const current = activeFilters[axisId] ?? []
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId]
    onChange({ ...activeFilters, [axisId]: next })
  }

  const clearAxis = (axisId) => {
    onChange({ ...activeFilters, [axisId]: [] })
  }

  const clearAll = () => {
    onChange({})
  }

  const totalActive = countActiveFilters(activeFilters)

  return (
    <div className="mb-10">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
        {FILTER_AXES.map((axis) => (
          <FilterDropdown
            key={axis.id}
            axis={axis}
            selected={activeFilters[axis.id] ?? []}
            onToggle={(optId) => toggleOption(axis.id, optId)}
            onClear={() => clearAxis(axis.id)}
          />
        ))}
      </div>

      {totalActive > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[0.72rem] text-[#a8acb5]">
          <span>
            {totalActive}{' '}
            {totalActive === 1
              ? t('catalog.filterActiveOne', 'filtro activo')
              : t('catalog.filterActiveMany', 'filtros activos')}
          </span>
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-[14px] leading-none" aria-hidden="true">close</span>
            {t('catalog.filterClearAll', 'Limpiar todos')}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default CatalogFilterBar
