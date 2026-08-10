import React from 'react';
import { QualityAnalysisBase } from './QualityAnalysisBase';
import { DefectType } from '../../utils/analysisUtils';

export function CartonQualityAnalysis() {
  return <QualityAnalysisBase defectType={DefectType.CARTON} />;
}

export default CartonQualityAnalysis;
