  // Prototype adapter only. All calculation and ledger functions above are unchanged.
  window.RVConcept={
    calc:calculate, snapshot, restore:restoreShift,
    set(values){Object.entries(values).forEach(([id,v])=>{$(id).value=String(v)});return calculate()},
    regime(value){doc.querySelector('[data-regime="'+value+'"]').click();return calculate()},
    rows:()=>structuredClone(monthEntries()), totals:()=>monthTotals(monthEntries()),
    save:saveShift, cancel:()=>setEditing(null),
    edit(id){const e=entries.find(e=>e.id===id);if(e){setEditing(e);restoreShift(e.saved)}},
    remove(id){const i=entries.findIndex(e=>e.id===id);if(i>=0){entries.splice(i,1);if(editingId===id)setEditing(null);renderMonth()}},
    month(value){selectedMonth=value;renderMonth()},
    months:()=>[...new Set(entries.map(e=>e.date.slice(0,7)))].sort(),
    selected:()=>selectedMonth,
    export:exportMonth, import:importMonth,
    audit:renderAudit, exportAudit,
    result:()=>lastCalc,
    error:()=>$('formError').hidden?'':$('formError').textContent,
    status:()=>$('shiftSaveStatus').textContent||$('monthStatus').textContent,
    editing:()=>editingId
  };
