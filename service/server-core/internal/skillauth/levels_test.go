package skillauth

import (
	"math"
	"testing"
	"time"
)

func levelAttempt(level string, score float64, day int) LevelScenarioAttempt {
	return LevelScenarioAttempt{Level: level, Score: score, MaxScore: 100, At: time.Date(2026, 10, 17+day, 0, 0, 0, 0, time.UTC).Format(time.RFC3339)}
}
func TestPreserveEarnedLevelAfterLowerFailure(t *testing.T) {
	p := DefaultLevelPolicy()
	attempts := []LevelScenarioAttempt{levelAttempt("L0", 80, 0), levelAttempt("L1", 85, 1), levelAttempt("L0", 50, 2)}
	out, e := EvaluateLevelScenario(p, attempts)
	if e != nil {
		t.Fatal(e)
	}
	last := out[2]
	if last.Passed || last.CurrentLevel != "L1" || last.HighestEarned != "L1" || last.Suspended {
		t.Fatalf("lower failure changed earned level: %+v", last)
	}
	attempts = append(attempts, levelAttempt("L2", 80, 3))
	out, e = EvaluateLevelScenario(p, attempts)
	if e != nil || !out[3].Passed || out[3].CurrentLevel != "L2" {
		t.Fatal("lower retake failure incorrectly blocks L2", e)
	}
}
func TestCriticalQuestionsFromBlueprint(t *testing.T) {
	p := DefaultLevelPolicy()
	a := levelAttempt("L0", 100, 0)
	a.CriticalFailed = 1
	out, e := EvaluateLevelScenario(p, []LevelScenarioAttempt{a})
	if e != nil || out[0].Passed || out[0].CurrentLevel != "" {
		t.Fatal("critical failure accepted", e)
	}
	a.CriticalFailed = 0
	a.Score = 75
	out, e = EvaluateLevelScenario(p, []LevelScenarioAttempt{a})
	if e != nil || !out[0].Passed {
		t.Fatal("threshold boundary failed", e)
	}
}
func TestLevelEligibilityAndLimits(t *testing.T) {
	p := DefaultLevelPolicy()
	out, e := EvaluateLevelScenario(p, []LevelScenarioAttempt{levelAttempt("L1", 100, 0)})
	if e != nil || out[0].Eligible {
		t.Fatal("prerequisite bypass", e)
	}
	p.Levels[0].MaxAttempts = 1
	out, e = EvaluateLevelScenario(p, []LevelScenarioAttempt{levelAttempt("L0", 0, 0), levelAttempt("L0", 100, 1)})
	if e != nil || out[1].Eligible {
		t.Fatal("attempt limit bypass", e)
	}
	p.Levels[0].MaxAttempts = 0
	p.Levels[0].CooldownHours = 48
	out, e = EvaluateLevelScenario(p, []LevelScenarioAttempt{levelAttempt("L0", 0, 0), levelAttempt("L0", 100, 1), levelAttempt("L0", 100, 2)})
	if e != nil || out[1].Eligible || !out[2].Passed {
		t.Fatal("cooldown incorrect", e)
	}
}
func TestPolicyValidationAndAlternativeRules(t *testing.T) {
	p := DefaultLevelPolicy()
	attempts := []LevelScenarioAttempt{levelAttempt("L0", 80, 0), levelAttempt("L1", 85, 1), levelAttempt("L0", 50, 2), levelAttempt("L0", 80, 3)}
	p.LowerFailure = "suspend"
	out, e := EvaluateLevelScenario(p, attempts)
	if e != nil || !out[2].Suspended || out[3].CurrentLevel != "L1" || out[3].Suspended {
		t.Fatal("suspend/revalidate failed", e)
	}
	p.LowerFailure = "recalculate"
	out, e = EvaluateLevelScenario(p, attempts)
	if e != nil || out[2].CurrentLevel != "" || out[3].CurrentLevel != "L0" || out[3].HighestEarned != "L1" {
		t.Fatal("recalculate failed", e)
	}
	p.LowerFailure = "invalid"
	if validateLevelPolicy(p) == nil {
		t.Fatal("invalid policy accepted")
	}
	p = DefaultLevelPolicy()
	p.Levels[0].PassPercent = 101
	if validateLevelPolicy(p) == nil {
		t.Fatal("threshold >100 accepted")
	}
	p.Levels[0].PassPercent = math.NaN()
	if validateLevelPolicy(p) == nil {
		t.Fatal("NaN accepted")
	}
	p = DefaultLevelPolicy()
	a := levelAttempt("L0", 101, 0)
	if _, e = EvaluateLevelScenario(p, []LevelScenarioAttempt{a}); e == nil {
		t.Fatal("score above max accepted")
	}
	a = levelAttempt("L0", 80, 0)
	a.At = "bad"
	if _, e = EvaluateLevelScenario(p, []LevelScenarioAttempt{a}); e == nil {
		t.Fatal("invalid date accepted")
	}
}
