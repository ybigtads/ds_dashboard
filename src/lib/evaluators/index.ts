import { EvaluationMetric } from '@/types';

export function rmse(predicted: number[], actual: number[]): number {
  if (predicted.length !== actual.length) {
    throw new Error('Predicted and actual arrays must have the same length');
  }

  const n = predicted.length;
  const sumSquaredErrors = predicted.reduce((sum, pred, i) => {
    const error = pred - actual[i];
    return sum + error * error;
  }, 0);

  return Math.sqrt(sumSquaredErrors / n);
}

export function accuracy(predicted: string[], actual: string[]): number {
  if (predicted.length !== actual.length) {
    throw new Error('Predicted and actual arrays must have the same length');
  }

  const correct = predicted.filter((pred, i) => pred === actual[i]).length;
  return correct / predicted.length;
}

export function f1Score(predicted: string[], actual: string[]): number {
  if (predicted.length !== actual.length) {
    throw new Error('Predicted and actual arrays must have the same length');
  }

  // Binary classification: assume positive class is '1' or 'true'
  const positiveClasses = ['1', 'true', 'yes', 'positive'];

  let tp = 0, fp = 0, fn = 0;

  for (let i = 0; i < predicted.length; i++) {
    const predPositive = positiveClasses.includes(predicted[i].toLowerCase());
    const actualPositive = positiveClasses.includes(actual[i].toLowerCase());

    if (predPositive && actualPositive) tp++;
    else if (predPositive && !actualPositive) fp++;
    else if (!predPositive && actualPositive) fn++;
  }

  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;

  if (precision + recall === 0) return 0;
  return 2 * (precision * recall) / (precision + recall);
}

export function auc(predicted: number[], actual: number[]): number {
  if (predicted.length !== actual.length) {
    throw new Error('Predicted and actual arrays must have the same length');
  }

  // Simple AUC calculation using trapezoidal rule
  const pairs: Array<{ pred: number; actual: number }> = predicted.map((pred, i) => ({
    pred,
    actual: actual[i],
  }));

  // Sort by predicted score descending
  pairs.sort((a, b) => b.pred - a.pred);

  let positives = 0;
  let negatives = 0;
  let sumRanks = 0;

  pairs.forEach((pair, rank) => {
    if (pair.actual === 1) {
      positives++;
      sumRanks += rank + 1;
    } else {
      negatives++;
    }
  });

  if (positives === 0 || negatives === 0) return 0.5;

  const aucValue = (sumRanks - (positives * (positives + 1)) / 2) / (positives * negatives);
  return 1 - aucValue; // Flip because we sorted descending
}

export const evaluators: Record<EvaluationMetric, (predicted: unknown[], actual: unknown[]) => number> = {
  rmse: (pred, act) => rmse(pred as number[], act as number[]),
  accuracy: (pred, act) => accuracy(pred as string[], act as string[]),
  f1: (pred, act) => f1Score(pred as string[], act as string[]),
  auc: (pred, act) => auc(pred as number[], act as number[]),
};

// Whether higher is better for each metric
export const higherIsBetter: Record<EvaluationMetric, boolean> = {
  rmse: false,
  accuracy: true,
  f1: true,
  auc: true,
};
