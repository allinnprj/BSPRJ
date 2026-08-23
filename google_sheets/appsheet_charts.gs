const CHARTS_LAYOUT = {
  summaryStartRow: 7,
  summaryLastColumn: 3,
  verdictStartRow: 7,
  verdictStartColumn: 5,
  verdictColumnCount: 4,
  chartStartColumn: 5,
  chartRowGap: 1,
  visibleLastColumn: 14,
  helperStartRow: 1,
  helperStartColumn: 17,
  helperColumnCount: 4
};

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
    const partText = normalizePartText_(record.partText);
    if (!PART_ORDER.includes(partText)) {
      console.warn(`Chart row skipped: unsupported PART "${partText}".`);
      return;
    }

    const coverage = coverageByDate[record.dateText] || {
      uniqueWindows: 0,
      validWindows: 0
    };
    coverage.uniqueWindows++;
    if (record.isValid) {
      coverage.validWindows++;
    }
    coverageByDate[record.dateText] = coverage;

    if (!record.isValid) {
      return;
    }

    const dateKey = record.dateText;
    byDatePart[dateKey] = byDatePart[dateKey] || {
      DAY: [],
      EVE: [],
      NGT: []
    };
    byDatePart[dateKey][partText].push(record.avgPeakToPeak);
    levelMix[record.levelText] = (levelMix[record.levelText] || 0) + 1;

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
    ? (coverageByDate[latestDate] || { uniqueWindows: 0, validWindows: 0 })
    : { uniqueWindows: '', validWindows: '' };
  const coverageRows = [
    ['VALID WINDOWS', latestCoverage.validWindows],
    [
      'MISSING WINDOWS',
      hasDisplayValue_(latestCoverage.uniqueWindows)
        ? Math.max(144 - toNumber_(latestCoverage.uniqueWindows), 0)
        : ''
    ]
  ];
  const verdictRows = buildDailyVerdictRows_(records);

  return {
    latestDate,
    dayPartRows,
    levelMixRows,
    coverageRows,
    verdictRows,
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

function buildDailyVerdictChartRows_(verdictRows) {
  const byDate = {};
  verdictRows.forEach((row) => {
    const dateKey = normalizeDateText_(row[1]);
    const partText = normalizePartText_(row[2]);
    byDate[dateKey] = byDate[dateKey] || {
      DAY: '',
      EVE: '',
      NGT: ''
    };
    byDate[dateKey][partText] = row[4];
  });

  return Object.keys(byDate).sort().map((dateKey) => ([
    dateKey,
    byDate[dateKey].DAY,
    byDate[dateKey].EVE,
    byDate[dateKey].NGT
  ]));
}

function rebuildAnalyticsCharts_(options) {
  const opts = typeof options === 'object' && options !== null
    ? options
    : { applyFormatting: options !== false };
  const shouldFormat = opts.applyFormatting === true;
  const silent = opts.silent === true;
  const cleanSheet = getOrCreateSheet_(CLEAN_SUMMARY_SHEET_NAME);
  const lastRow = cleanSheet.getLastRow();
  if (lastRow < 2) {
    if (!silent) {
      SpreadsheetApp.getActiveSpreadsheet().toast('No clean summary data yet. Run Refresh latest data first.', 'BS Noise', 6);
    }
    return;
  }

  const values = cleanSheet.getRange(2, 1, lastRow - 1, CLEAN_SUMMARY_HEADERS.length).getValues();
  const records = values.map((row) => ({
    dateText: normalizeDateText_(row[3]),
    partText: normalizePartText_(row[6]),
    avgPeakToPeak: toNumber_(row[13]),
    levelText: String(row[7] || ''),
    isValid: toNumber_(row[27]) === 1,
    gapBefore: toNumber_(row[28])
  }));

  const chartBlocks = buildChartSourceBlocks_(records);
  const verdictChartRows = buildDailyVerdictChartRows_(chartBlocks.verdictRows);
  const verdictDisplayRows = verdictChartRows.slice().reverse();
  const sheet = getOrCreateSheet_(CHARTS_SHEET_NAME);
  ensureMinColumnCount_(
    sheet,
    CHARTS_LAYOUT.helperStartColumn + CHARTS_LAYOUT.helperColumnCount - 1
  );
  const previousLastRow = Math.max(sheet.getLastRow(), 1);
  const verdictHeaderRow = CHARTS_LAYOUT.verdictStartRow + 2;
  const verdictDataStartRow = verdictHeaderRow + 1;
  const chartStartRow = verdictDataStartRow +
    Math.max(verdictDisplayRows.length, 1) +
    CHARTS_LAYOUT.chartRowGap;
  const dashboardLastRow = Math.max(
    25,
    verdictDataStartRow + Math.max(verdictDisplayRows.length, 1) - 1,
    chartStartRow + 13
  );
  sheet.clearContents();
  if (shouldFormat) {
    sheet.clearFormats();
    sheet.getCharts().forEach((chart) => sheet.removeChart(chart));
    sheet.showColumns(1, sheet.getMaxColumns());
    sheet.getRange(
      1,
      1,
      Math.min(sheet.getMaxRows(), Math.max(previousLastRow, dashboardLastRow)),
      CHARTS_LAYOUT.helperStartColumn + CHARTS_LAYOUT.helperColumnCount - 1
    ).breakApart();
    sheet.setFrozenRows(0);
    sheet.setFrozenColumns(0);
    sheet.setHiddenGridlines(true);
    sheet.setRowHeights(1, dashboardLastRow, 24);
    sheet.setRowHeight(1, 32);
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 110);
    sheet.setColumnWidth(3, 300);
    sheet.setColumnWidth(4, 28);
    sheet.setColumnWidth(5, 220);
    sheet.setColumnWidths(6, 3, 140);
    sheet.setColumnWidths(9, 6, 90);
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
    .setHorizontalAlignment('center');
  if (shouldFormat) {
    sheet.getRange(7, 1, 1, 3).setBackground('#eaf4e3').setFontWeight('bold');
    sheet.getRange(8, 1, 1, 3).setBackground('#eff7ea').setFontWeight('bold');
  }
  sheet.getRange(8, 1, 1, 3).setValues([['PART', 'AVG P2P', 'DIAGRAM']]);
  const dayPartDisplayRows = chartBlocks.dayPartRows.map((row) => [
    row[0],
    buildChartCellText_(row[1]),
    `${buildTextBar_(row[1], 850, 24)} ${buildChartCellText_(row[1])}`
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
  }

  sheet.getRange(
    CHARTS_LAYOUT.verdictStartRow,
    CHARTS_LAYOUT.verdictStartColumn,
    1,
    CHARTS_LAYOUT.verdictColumnCount
  ).merge().setValue('DAILY VERDICT · LEVEL BY DATE')
    .setHorizontalAlignment('center');
  sheet.getRange(
    CHARTS_LAYOUT.verdictStartRow + 1,
    CHARTS_LAYOUT.verdictStartColumn,
    1,
    CHARTS_LAYOUT.verdictColumnCount
  ).merge().setValue('Scale: 1 = SILENT, 2 = NORMAL, 3 = LOUD, 4 = PEAK')
    .setHorizontalAlignment('center');
  sheet.getRange(
    verdictHeaderRow,
    CHARTS_LAYOUT.verdictStartColumn,
    1,
    CHARTS_LAYOUT.verdictColumnCount
  ).setValues([['DATE', 'DAY', 'EVE', 'NGT']]);
  if (verdictDisplayRows.length > 0) {
    sheet.getRange(
      verdictDataStartRow,
      CHARTS_LAYOUT.verdictStartColumn,
      verdictDisplayRows.length,
      CHARTS_LAYOUT.verdictColumnCount
    ).setValues(verdictDisplayRows);
  } else {
    sheet.getRange(
      verdictDataStartRow,
      CHARTS_LAYOUT.verdictStartColumn,
      1,
      CHARTS_LAYOUT.verdictColumnCount
    ).merge().setValue('No data yet').setHorizontalAlignment('center');
  }

  if (shouldFormat) {
    sheet.getRange(CHARTS_LAYOUT.verdictStartRow, CHARTS_LAYOUT.verdictStartColumn, 1, 4)
      .setBackground('#fce5cd').setFontWeight('bold');
    sheet.getRange(CHARTS_LAYOUT.verdictStartRow + 1, CHARTS_LAYOUT.verdictStartColumn, 1, 4)
      .setBackground('#fff5e8').setFontColor('#7f6000');
    sheet.getRange(verdictHeaderRow, CHARTS_LAYOUT.verdictStartColumn, 1, 4)
      .setBackground('#fff0d9').setFontWeight('bold');
    sheet.getRange(
      CHARTS_LAYOUT.verdictStartRow,
      CHARTS_LAYOUT.verdictStartColumn,
      Math.max(verdictDisplayRows.length, 1) + 3,
      CHARTS_LAYOUT.verdictColumnCount
    ).setHorizontalAlignment('center');
    if (verdictChartRows.length > 0) {
      sheet.getRange(verdictDataStartRow, CHARTS_LAYOUT.verdictStartColumn, verdictChartRows.length, 4)
        .setBackgrounds(buildSolidBackgrounds_(verdictChartRows.length, 4, '#fffdf8'));
      sheet.getRange(verdictHeaderRow, CHARTS_LAYOUT.verdictStartColumn, verdictChartRows.length + 1, 4)
        .setBorder(true, true, true, true, true, true, '#d7dde5', SpreadsheetApp.BorderStyle.SOLID);
    } else {
      sheet.getRange(verdictDataStartRow, CHARTS_LAYOUT.verdictStartColumn, 1, 4)
        .setBackground('#fffdf8')
        .setFontColor('#777777')
        .setBorder(true, true, true, true, true, true, '#d7dde5', SpreadsheetApp.BorderStyle.SOLID);
    }

    sheet.getRange(
      CHARTS_LAYOUT.helperStartRow,
      CHARTS_LAYOUT.helperStartColumn,
      1,
      CHARTS_LAYOUT.helperColumnCount
    ).setValues([['DATE', 'DAY', 'EVE', 'NGT']]);
    if (verdictChartRows.length > 0) {
      sheet.getRange(
        CHARTS_LAYOUT.helperStartRow + 1,
        CHARTS_LAYOUT.helperStartColumn,
        verdictChartRows.length,
        CHARTS_LAYOUT.helperColumnCount
      ).setValues(verdictChartRows);
    }
    sheet.hideColumns(CHARTS_LAYOUT.helperStartColumn, CHARTS_LAYOUT.helperColumnCount);

    if (verdictChartRows.length > 0) {
      const chart = sheet.newChart()
        .setChartType(Charts.ChartType.COLUMN)
        .addRange(sheet.getRange(
          CHARTS_LAYOUT.helperStartRow,
          CHARTS_LAYOUT.helperStartColumn,
          verdictChartRows.length + 1,
          CHARTS_LAYOUT.helperColumnCount
        ))
        .setPosition(chartStartRow, CHARTS_LAYOUT.chartStartColumn, 0, 0)
        .setOption('title', 'Daily Verdict by Date')
        .setOption('legend', { position: 'top' })
        .setOption('height', 320)
        .setOption('width', 640)
        .setOption('series', {
          0: { color: '#cfe2f3' },
          1: { color: '#f9cb9c' },
          2: { color: '#d9ead3' }
        })
        .setOption('vAxis', {
          viewWindow: { min: 1, max: 4 },
          ticks: [
            { v: 1, f: 'SILENT' },
            { v: 2, f: 'NORMAL' },
            { v: 3, f: 'LOUD' },
            { v: 4, f: 'PEAK' }
          ]
        })
        .setOption('hAxis', { slantedText: true, slantedTextAngle: 45 })
        .build();
      sheet.insertChart(chart);
    }

    sheet.getRange(1, 1, dashboardLastRow, CHARTS_LAYOUT.visibleLastColumn).setVerticalAlignment('middle');
    sheet.getRange(1, 1, dashboardLastRow, CHARTS_LAYOUT.visibleLastColumn).setWrap(false);
  }
}
