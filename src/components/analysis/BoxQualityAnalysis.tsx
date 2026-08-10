import React from 'react';
import { QualityAnalysisBase } from './QualityAnalysisBase';
import { DefectType } from '../../utils/analysisUtils';

export function BoxQualityAnalysis() {
  return <QualityAnalysisBase defectType={DefectType.BOX} />;
}

export default BoxQualityAnalysis;
