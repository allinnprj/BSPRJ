function buildChartSourceBlocks_(records) {
  const byDatePart = {};
  const levelMix = {
    SILENT: 0,
    NORMAL: 0,
    LOUD: 0,
    PEAK: 0
  };
  const coverageByDate = {};

  records.forEach((record) => {
    if (!record.isValid) {
      return;
    }

    const dateKey = record.dateText;
    byDatePart[dateKey] = byDatePart[dateKey] || {
      DAY: [],
      EVE: [],
      NGT: []
    };
    byDatePart[dateKey][record.partText].push(record.nowPct);
    levelMix[record.levelText] = (levelMix[record.levelText] || 0) + 1;

    const coverage = coverageByDate[dateKey] || { validWindows: 0, missingWindows: 0 };
    coverage.validWindows++;
    coverage.missingWindows += record.gapBefore || 0;
    coverageByDate[dateKey] = coverage;
  });

  const sortedDates = Object.keys(byDatePart).sort();
  const latestDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : '';
  const latestBucket = latestDate ? byDatePart[latestDate] : { DAY: [], EVE: [], NGT: [] };
  const dayPartRows = PART_ORDER.map((partText) => {
    const values = latestBucket[partText] || [];
    return [
      partText,
      values.length
        ? roundValue_(values.reduce((sum, value) => sum + value, 0) / values.length, 1)
        : ''
    ];
  });

  const totalLevelWindows = LEVEL_ORDER.reduce((sum, level) => sum + (levelMix[level] || 0), 0);
  const levelMixRows = LEVEL_ORDER.map((level) => ([
    level,
    totalLevelWindows
      ? roundValue_((levelMix[level] || 0) * 100 / totalLevelWindows, 1)
      : ''
  ]));

  const latestCoverage = latestDate
    ? (coverageByDate[latestDate] || { validWindows: 0, missingWindows: 0 })
    : { validWindows: '', missingWindows: '' };
  const coverageRows = [
    ['VALID WINDOWS', latestCoverage.validWindows],
    ['MISSING WINDOWS', latestCoverage.missingWindows]
  ];

  return {
    latestDate,
    dayPartRows,
    levelMixRows,
    coverageRows,
    coveragePct: hasDisplayValue_(latestCoverage.validWindows)
      ? roundValue_(toNumber_(latestCoverage.validWindows) * 100 / 144, 1)
      : ''
  };
}

function buildChartCellText_(value, suffix) {
  return hasDisplayValue_(value) ? `${value}${suffix || ''}` : 'no data';
}

function buildTextBar_(value, maxValue, width) {
  if (!hasDisplayValue_(value)) {
    return '[no data]';
  }

  const safeMax = Math.max(maxValue || 0, 1);
  const ratio = Math.max(0, Math.min(1, toNumber_(value) / safeMax));
  const totalWidth = Math.max(width || 10, 1);
  const filled = Math.round(ratio * totalWidth);
  return `[${'='.repeat(filled)}${'.'.repeat(totalWidth - filled)}]`;
}

function rebuildAnalyticsCharts_(options) {
  const opts = typeof options === 'object' && options !== null
    ? options
    : { applyFormatting: options === true };
  const shouldFormat = opts.applyFormatting === true;
  const silent = opts.silent === true;
  const cleanSheet = getOrCreateSheet_(CLEAN_SUMMARY_SHEET_NAME);
  const lastRow = cleanSheet.getLastRow();
  if (lastRow < 2) {
    if (!silent) {
      SpreadsheetApp.getActiveSpreadsheet().toast('No clean summary data yet. Run rebuildAnalytics_ first.', 'BS Noise', 6);
    }
    return;
  }

  const values = cleanSheet.getRange(2, 1, lastRow - 1, CLEAN_SUMMARY_HEADERS.length).getValues();
  const records = values.map((row) => ({
    dateText: normalizeDateText_(row[3]),
    partText: normalizePartText_(row[6]),
    nowPct: toNumber_(row[8]),
    levelText: String(row[7] || ''),
    isValid: toNumber_(row[27]) === 1,
    gapBefore: toNumber_(row[28])
  }));

  const chartBlocks = buildChartSourceBlocks_(records);
  const sheet = getOrCreateSheet_(CHARTS_SHEET_NAME);
  ensureMinColumnCount_(sheet, 6);
  sheet.clearContents();
  if (shouldFormat) {
    sheet.clearFormats();
    sheet.getCharts().forEach((chart) => sheet.removeChart(chart));
    sheet.showColumns(1, sheet.getMaxColumns());
    sheet.setFrozenRows(0);
    sheet.setFrozenColumns(0);
    sheet.setHiddenGridlines(true);
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 110);
    sheet.setColumnWidth(3, 300);
    sheet.setColumnWidth(4, 150);
    sheet.setColumnWidth(5, 110);
    sheet.setColumnWidth(6, 110);
  }

  sheet.getRange(1, 1, 1, 6).merge();
  sheet.getRange(1, 1).setValue('DASHBOARD · QUICK VIEW')
    .setHorizontalAlignment('left');
  if (shouldFormat) {
    sheet.getRange(1, 1)
      .setFontWeight('bold')
      .setFontSize(16)
      .setBackground('#d9ead3')
      .setFontColor('#274e13');
  }
  sheet.getRange(2, 1, 1, 6).merge();
  sheet.getRange(2, 1).setValue(
    chartBlocks.latestDate
      ? `Latest date: ${chartBlocks.latestDate}. Use charts for quick reading and summary_* sheets for exact numbers.`
      : 'Use charts for quick reading and summary_* sheets for exact numbers.'
  )
    .setHorizontalAlignment('left');
  if (shouldFormat) {
    sheet.getRange(2, 1)
      .setFontSize(10)
      .setBackground('#eef7ea')
      .setFontColor('#4d5b45');
  }

  sheet.getRange(4, 1, 1, 2).setValues([['Current day focus', chartBlocks.latestDate || 'n/a']]);
  sheet.getRange(4, 3, 1, 2).setValues([['Valid windows', buildChartCellText_(chartBlocks.coverageRows[0][1])]]);
  sheet.getRange(4, 5, 1, 2).setValues([['Missing windows', buildChartCellText_(chartBlocks.coverageRows[1][1])]]);
  if (shouldFormat) {
    sheet.getRange(4, 1, 1, 6).setBackground('#f3f6fa').setFontWeight('bold');
  }
  sheet.getRange(5, 1, 1, 2).setValues([['Coverage %', buildChartCellText_(chartBlocks.coveragePct, '%')]]);
  sheet.getRange(5, 3, 1, 4).merge();
  sheet.getRange(5, 3).setValue(`${buildTextBar_(chartBlocks.coveragePct, 100, 24)} ${buildChartCellText_(chartBlocks.coveragePct, '%')}`)
    .setHorizontalAlignment('left');
  if (shouldFormat) {
    sheet.getRange(5, 1, 1, 6).setBackground('#fbfdf8');
  }

  sheet.getRange(7, 1, 1, 3).merge().setValue('DAYPART LEVELS')
    .setHorizontalAlignment('left');
  if (shouldFormat) {
    sheet.getRange(7, 1, 1, 3).setBackground('#eaf4e3').setFontWeight('bold');
    sheet.getRange(8, 1, 1, 3).setBackground('#eff7ea').setFontWeight('bold');
  }
  sheet.getRange(8, 1, 1, 3).setValues([['PART', 'AVG NOW %', 'DIAGRAM']]);
  const dayPartDisplayRows = chartBlocks.dayPartRows.map((row) => [
    row[0],
    buildChartCellText_(row[1], '%'),
    `${buildTextBar_(row[1], 100, 24)} ${buildChartCellText_(row[1], '%')}`
  ]);
  sheet.getRange(9, 1, dayPartDisplayRows.length, 3).setValues(dayPartDisplayRows);
  if (shouldFormat) {
    sheet.getRange(9, 1, dayPartDisplayRows.length, 3).setBackgrounds(buildSolidBackgrounds_(dayPartDisplayRows.length, 3, '#fbfdf8'));
  }

  sheet.getRange(14, 1, 1, 3).merge().setValue('NOISE MIX')
    .setHorizontalAlignment('left');
  if (shouldFormat) {
    sheet.getRange(14, 1, 1, 3).setBackground('#fff7df').setFontWeight('bold');
    sheet.getRange(15, 1, 1, 3).setBackground('#fffaf0').setFontWeight('bold');
  }
  sheet.getRange(15, 1, 1, 3).setValues([['LEVEL', 'SHARE %', 'DIAGRAM']]);
  const levelDisplayRows = chartBlocks.levelMixRows.map((row) => [
    row[0],
    buildChartCellText_(row[1], '%'),
    `${buildTextBar_(row[1], 100, 24)} ${buildChartCellText_(row[1], '%')}`
  ]);
  sheet.getRange(16, 1, levelDisplayRows.length, 3).setValues(levelDisplayRows);
  if (shouldFormat) {
    sheet.getRange(16, 1, levelDisplayRows.length, 3).setBackgrounds(buildSolidBackgrounds_(levelDisplayRows.length, 3, '#fffdfa'));
  }

  sheet.getRange(22, 1, 1, 3).merge().setValue('DATA COVERAGE')
    .setHorizontalAlignment('left');
  if (shouldFormat) {
    sheet.getRange(22, 1, 1, 3).setBackground('#fde9e7').setFontWeight('bold');
    sheet.getRange(23, 1, 1, 3).setBackground('#fff3f3').setFontWeight('bold');
  }
  sheet.getRange(23, 1, 1, 3).setValues([['METRIC', 'VALUE', 'DIAGRAM']]);
  const coverageDisplayRows = chartBlocks.coverageRows.map((row) => [
    row[0],
    buildChartCellText_(row[1]),
    buildTextBar_(row[1], 144, 24)
  ]);
  sheet.getRange(24, 1, coverageDisplayRows.length, 3).setValues(coverageDisplayRows);
  if (shouldFormat) {
    sheet.getRange(24, 1, coverageDisplayRows.length, 3).setBackgrounds(buildSolidBackgrounds_(coverageDisplayRows.length, 3, '#fffafa'));
    sheet.getRange(7, 1, 18, 3).setBorder(true, true, true, true, true, true, '#d7dde5', SpreadsheetApp.BorderStyle.SOLID);
    sheet.getRange(1, 1, 25, 6).setVerticalAlignment('middle');
    sheet.getRange(1, 1, 25, 6).setWrap(false);
  }
}
