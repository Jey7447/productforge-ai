ALTER TABLE public.validation_tests
  ADD COLUMN IF NOT EXISTS sample_size integer,
  ADD COLUMN IF NOT EXISTS problem_confirmations integer,
  ADD COLUMN IF NOT EXISTS positive_signals integer,
  ADD COLUMN IF NOT EXISTS commitment_signals integer,
  ADD COLUMN IF NOT EXISTS negative_signals integer,
  ADD COLUMN IF NOT EXISTS validation_score numeric,
  ADD COLUMN IF NOT EXISTS signal_summary text;

ALTER TABLE public.validation_tests
  ADD CONSTRAINT validation_tests_sample_size_check CHECK (sample_size IS NULL OR sample_size >= 0),
  ADD CONSTRAINT validation_tests_problem_confirmations_check CHECK (problem_confirmations IS NULL OR problem_confirmations >= 0),
  ADD CONSTRAINT validation_tests_positive_signals_check CHECK (positive_signals IS NULL OR positive_signals >= 0),
  ADD CONSTRAINT validation_tests_commitment_signals_check CHECK (commitment_signals IS NULL OR commitment_signals >= 0),
  ADD CONSTRAINT validation_tests_negative_signals_check CHECK (negative_signals IS NULL OR negative_signals >= 0),
  ADD CONSTRAINT validation_tests_validation_score_check CHECK (validation_score IS NULL OR (validation_score >= 0 AND validation_score <= 100));
