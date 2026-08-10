import React from 'react';
import { QualityAnalysisBase } from './QualityAnalysisBase';
import { DefectType } from '../../utils/analysisUtils';

export function PackQualityAnalysis() {
  return <QualityAnalysisBase defectType={DefectType.PACK} />;
}

export default PackQualityAnalysis;
