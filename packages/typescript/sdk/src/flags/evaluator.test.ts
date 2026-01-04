import { describe, it, expect, beforeEach } from 'vitest';
import { FlagEvaluator, evaluateFlag } from './evaluator.js';
import type {
  FlagConfiguration,
  FlagDefinition,
  SegmentDefinition,
} from './config-types.js';
import type { EvaluationContext } from './types.js';

describe('FlagEvaluator', () => {
  let evaluator: FlagEvaluator;

  const createConfig = (
    flags: FlagDefinition[],
    segments: SegmentDefinition[] = [],
  ): FlagConfiguration => ({
    environmentId: 'env-123',
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    etag: '"abc123"',
    flags,
    segments,
  });

  beforeEach(() => {
    evaluator = new FlagEvaluator();
  });

  describe('setConfiguration / isReady', () => {
    it('should not be ready before configuration is set', () => {
      expect(evaluator.isReady()).toBe(false);
    });

    it('should be ready after configuration is set', () => {
      evaluator.setConfiguration(createConfig([]));
      expect(evaluator.isReady()).toBe(true);
    });

    it('should return the ETag', () => {
      evaluator.setConfiguration(createConfig([]));
      expect(evaluator.getETag()).toBe('"abc123"');
    });
  });

  describe('evaluate - basic flags', () => {
    it('should return FLAG_NOT_FOUND for unknown flag', () => {
      evaluator.setConfiguration(createConfig([]));
      const result = evaluator.evaluate('unknown-flag');

      expect(result.flagKey).toBe('unknown-flag');
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('ERROR');
      expect(result.errorCode).toBe('FLAG_NOT_FOUND');
    });

    it('should return default value for flag without rules', () => {
      const flags: FlagDefinition[] = [
        {
          key: 'simple-flag',
          valueType: 'boolean',
          defaultEnabled: true,
          defaultValue: true,
          rules: [],
        },
      ];

      evaluator.setConfiguration(createConfig(flags));
      const result = evaluator.evaluate('simple-flag');

      expect(result.flagKey).toBe('simple-flag');
      expect(result.enabled).toBe(true);
      expect(result.value).toBe(true);
      expect(result.reason).toBe('DEFAULT');
    });

    it('should return default disabled state', () => {
      const flags: FlagDefinition[] = [
        {
          key: 'disabled-flag',
          valueType: 'boolean',
          defaultEnabled: false,
          defaultValue: true,
          rules: [],
        },
      ];

      evaluator.setConfiguration(createConfig(flags));
      const result = evaluator.evaluate('disabled-flag');

      expect(result.enabled).toBe(false);
      expect(result.value).toBeNull();
      expect(result.reason).toBe('DEFAULT');
    });
  });

  describe('evaluate - rules without segments', () => {
    it('should match rule without segment (applies to all)', () => {
      const flags: FlagDefinition[] = [
        {
          key: 'feature',
          valueType: 'string',
          defaultEnabled: false,
          defaultValue: 'default',
          rules: [
            {
              priority: 0,
              enabled: true,
              value: 'rule-value',
            },
          ],
        },
      ];

      evaluator.setConfiguration(createConfig(flags));
      const result = evaluator.evaluate('feature');

      expect(result.enabled).toBe(true);
      expect(result.value).toBe('rule-value');
      expect(result.reason).toBe('STATIC');
    });

    it('should respect rule priority order', () => {
      const flags: FlagDefinition[] = [
        {
          key: 'feature',
          valueType: 'string',
          defaultEnabled: false,
          defaultValue: 'default',
          rules: [
            {
              priority: 1,
              enabled: true,
              value: 'second-rule',
            },
            {
              priority: 0,
              enabled: true,
              value: 'first-rule',
            },
          ],
        },
      ];

      evaluator.setConfiguration(createConfig(flags));
      const result = evaluator.evaluate('feature');

      expect(result.value).toBe('first-rule');
    });
  });

  describe('evaluate - segment targeting', () => {
    const segments: SegmentDefinition[] = [
      {
        key: 'premium-users',
        name: 'Premium Users',
        rules: [{ field: 'plan', operator: 'eq', value: 'premium' }],
      },
      {
        key: 'us-users',
        name: 'US Users',
        rules: [{ field: 'country', operator: 'eq', value: 'US' }],
      },
      {
        key: 'premium-us-users',
        name: 'Premium US Users',
        rules: [
          { field: 'plan', operator: 'eq', value: 'premium' },
          { field: 'country', operator: 'eq', value: 'US' },
        ],
      },
    ];

    it('should match segment with eq operator', () => {
      const flags: FlagDefinition[] = [
        {
          key: 'premium-feature',
          valueType: 'boolean',
          defaultEnabled: false,
          defaultValue: false,
          rules: [
            {
              priority: 0,
              segmentKey: 'premium-users',
              enabled: true,
              value: true,
            },
          ],
        },
      ];

      evaluator.setConfiguration(createConfig(flags, segments));

      // Premium user should match
      const premiumResult = evaluator.evaluate('premium-feature', {
        targetingKey: 'user-1',
        plan: 'premium',
      });
      expect(premiumResult.enabled).toBe(true);
      expect(premiumResult.value).toBe(true);
      expect(premiumResult.reason).toBe('TARGETING_MATCH');

      // Free user should not match
      const freeResult = evaluator.evaluate('premium-feature', {
        targetingKey: 'user-2',
        plan: 'free',
      });
      expect(freeResult.enabled).toBe(false);
      expect(freeResult.reason).toBe('DEFAULT');
    });

    it('should require all segment rules to match (AND logic)', () => {
      const flags: FlagDefinition[] = [
        {
          key: 'exclusive-feature',
          valueType: 'boolean',
          defaultEnabled: false,
          defaultValue: false,
          rules: [
            {
              priority: 0,
              segmentKey: 'premium-us-users',
              enabled: true,
              value: true,
            },
          ],
        },
      ];

      evaluator.setConfiguration(createConfig(flags, segments));

      // Premium US user should match
      const matchResult = evaluator.evaluate('exclusive-feature', {
        plan: 'premium',
        country: 'US',
      });
      expect(matchResult.enabled).toBe(true);

      // Premium non-US user should not match
      const noMatchResult = evaluator.evaluate('exclusive-feature', {
        plan: 'premium',
        country: 'UK',
      });
      expect(noMatchResult.enabled).toBe(false);
    });
  });

  describe('evaluate - percentage rollout', () => {
    it('should include user in rollout when hash is below percentage', () => {
      const flags: FlagDefinition[] = [
        {
          key: 'gradual-rollout',
          valueType: 'boolean',
          defaultEnabled: false,
          defaultValue: false,
          rules: [
            {
              priority: 0,
              rolloutPercentage: 100, // 100% should always include
              enabled: true,
              value: true,
            },
          ],
        },
      ];

      evaluator.setConfiguration(createConfig(flags));

      const result = evaluator.evaluate('gradual-rollout', {
        targetingKey: 'any-user',
      });
      expect(result.enabled).toBe(true);
      expect(result.reason).toBe('SPLIT');
    });

    it('should exclude user from rollout when hash is above percentage', () => {
      const flags: FlagDefinition[] = [
        {
          key: 'gradual-rollout',
          valueType: 'boolean',
          defaultEnabled: false,
          defaultValue: false,
          rules: [
            {
              priority: 0,
              rolloutPercentage: 0, // 0% should never include
              enabled: true,
              value: true,
            },
          ],
        },
      ];

      evaluator.setConfiguration(createConfig(flags));

      const result = evaluator.evaluate('gradual-rollout', {
        targetingKey: 'any-user',
      });
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('DEFAULT');
    });

    it('should require targetingKey for percentage rollout', () => {
      const flags: FlagDefinition[] = [
        {
          key: 'gradual-rollout',
          valueType: 'boolean',
          defaultEnabled: false,
          defaultValue: false,
          rules: [
            {
              priority: 0,
              rolloutPercentage: 50,
              enabled: true,
              value: true,
            },
          ],
        },
      ];

      evaluator.setConfiguration(createConfig(flags));

      // Without targetingKey, should not match rollout rule
      const result = evaluator.evaluate('gradual-rollout');
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('DEFAULT');
    });

    it('should be consistent for the same user', () => {
      const flags: FlagDefinition[] = [
        {
          key: 'gradual-rollout',
          valueType: 'boolean',
          defaultEnabled: false,
          defaultValue: false,
          rules: [
            {
              priority: 0,
              rolloutPercentage: 50,
              enabled: true,
              value: true,
            },
          ],
        },
      ];

      evaluator.setConfiguration(createConfig(flags));

      // Same user should always get the same result
      const results: boolean[] = [];
      for (let i = 0; i < 10; i++) {
        const result = evaluator.evaluate('gradual-rollout', {
          targetingKey: 'consistent-user',
        });
        results.push(result.enabled);
      }

      // All results should be the same
      expect(new Set(results).size).toBe(1);
    });
  });

  describe('segment operators', () => {
    const createFlagWithSegment = (
      segmentRules: SegmentDefinition['rules'],
    ): { flags: FlagDefinition[]; segments: SegmentDefinition[] } => ({
      flags: [
        {
          key: 'test-flag',
          valueType: 'boolean',
          defaultEnabled: false,
          defaultValue: false,
          rules: [
            {
              priority: 0,
              segmentKey: 'test-segment',
              enabled: true,
              value: true,
            },
          ],
        },
      ],
      segments: [
        {
          key: 'test-segment',
          rules: segmentRules,
        },
      ],
    });

    it('neq operator', () => {
      const { flags, segments } = createFlagWithSegment([
        { field: 'plan', operator: 'neq', value: 'enterprise' },
      ]);

      evaluator.setConfiguration(createConfig(flags, segments));

      expect(evaluator.evaluate('test-flag', { plan: 'free' }).enabled).toBe(
        true,
      );
      expect(
        evaluator.evaluate('test-flag', { plan: 'enterprise' }).enabled,
      ).toBe(false);
    });

    it('contains operator', () => {
      const { flags, segments } = createFlagWithSegment([
        { field: 'email', operator: 'contains', value: '@company.com' },
      ]);

      evaluator.setConfiguration(createConfig(flags, segments));

      expect(
        evaluator.evaluate('test-flag', { email: 'user@company.com' }).enabled,
      ).toBe(true);
      expect(
        evaluator.evaluate('test-flag', { email: 'user@other.com' }).enabled,
      ).toBe(false);
    });

    it('not_contains operator', () => {
      const { flags, segments } = createFlagWithSegment([
        { field: 'email', operator: 'not_contains', value: '@competitor.com' },
      ]);

      evaluator.setConfiguration(createConfig(flags, segments));

      expect(
        evaluator.evaluate('test-flag', { email: 'user@company.com' }).enabled,
      ).toBe(true);
      expect(
        evaluator.evaluate('test-flag', { email: 'user@competitor.com' })
          .enabled,
      ).toBe(false);
    });

    it('starts_with operator', () => {
      const { flags, segments } = createFlagWithSegment([
        { field: 'userId', operator: 'starts_with', value: 'admin_' },
      ]);

      evaluator.setConfiguration(createConfig(flags, segments));

      expect(
        evaluator.evaluate('test-flag', { userId: 'admin_123' }).enabled,
      ).toBe(true);
      expect(
        evaluator.evaluate('test-flag', { userId: 'user_123' }).enabled,
      ).toBe(false);
    });

    it('ends_with operator', () => {
      const { flags, segments } = createFlagWithSegment([
        { field: 'email', operator: 'ends_with', value: '.edu' },
      ]);

      evaluator.setConfiguration(createConfig(flags, segments));

      expect(
        evaluator.evaluate('test-flag', { email: 'student@university.edu' })
          .enabled,
      ).toBe(true);
      expect(
        evaluator.evaluate('test-flag', { email: 'user@company.com' }).enabled,
      ).toBe(false);
    });

    it('gt operator', () => {
      const { flags, segments } = createFlagWithSegment([
        { field: 'age', operator: 'gt', value: '18' },
      ]);

      evaluator.setConfiguration(createConfig(flags, segments));

      expect(evaluator.evaluate('test-flag', { age: 21 }).enabled).toBe(true);
      expect(evaluator.evaluate('test-flag', { age: 18 }).enabled).toBe(false);
      expect(evaluator.evaluate('test-flag', { age: 16 }).enabled).toBe(false);
    });

    it('gte operator', () => {
      const { flags, segments } = createFlagWithSegment([
        { field: 'age', operator: 'gte', value: '18' },
      ]);

      evaluator.setConfiguration(createConfig(flags, segments));

      expect(evaluator.evaluate('test-flag', { age: 21 }).enabled).toBe(true);
      expect(evaluator.evaluate('test-flag', { age: 18 }).enabled).toBe(true);
      expect(evaluator.evaluate('test-flag', { age: 16 }).enabled).toBe(false);
    });

    it('lt operator', () => {
      const { flags, segments } = createFlagWithSegment([
        { field: 'age', operator: 'lt', value: '18' },
      ]);

      evaluator.setConfiguration(createConfig(flags, segments));

      expect(evaluator.evaluate('test-flag', { age: 16 }).enabled).toBe(true);
      expect(evaluator.evaluate('test-flag', { age: 18 }).enabled).toBe(false);
      expect(evaluator.evaluate('test-flag', { age: 21 }).enabled).toBe(false);
    });

    it('lte operator', () => {
      const { flags, segments } = createFlagWithSegment([
        { field: 'age', operator: 'lte', value: '18' },
      ]);

      evaluator.setConfiguration(createConfig(flags, segments));

      expect(evaluator.evaluate('test-flag', { age: 16 }).enabled).toBe(true);
      expect(evaluator.evaluate('test-flag', { age: 18 }).enabled).toBe(true);
      expect(evaluator.evaluate('test-flag', { age: 21 }).enabled).toBe(false);
    });

    it('exists operator', () => {
      const { flags, segments } = createFlagWithSegment([
        { field: 'betaOptIn', operator: 'exists' },
      ]);

      evaluator.setConfiguration(createConfig(flags, segments));

      expect(
        evaluator.evaluate('test-flag', { betaOptIn: true }).enabled,
      ).toBe(true);
      expect(
        evaluator.evaluate('test-flag', { betaOptIn: false }).enabled,
      ).toBe(true);
      expect(evaluator.evaluate('test-flag', {}).enabled).toBe(false);
    });

    it('not_exists operator', () => {
      const { flags, segments } = createFlagWithSegment([
        { field: 'blockedReason', operator: 'not_exists' },
      ]);

      evaluator.setConfiguration(createConfig(flags, segments));

      expect(evaluator.evaluate('test-flag', {}).enabled).toBe(true);
      expect(
        evaluator.evaluate('test-flag', { blockedReason: 'spam' }).enabled,
      ).toBe(false);
    });

    it('in operator', () => {
      const { flags, segments } = createFlagWithSegment([
        { field: 'country', operator: 'in', value: 'US,CA,UK' },
      ]);

      evaluator.setConfiguration(createConfig(flags, segments));

      expect(evaluator.evaluate('test-flag', { country: 'US' }).enabled).toBe(
        true,
      );
      expect(evaluator.evaluate('test-flag', { country: 'CA' }).enabled).toBe(
        true,
      );
      expect(evaluator.evaluate('test-flag', { country: 'DE' }).enabled).toBe(
        false,
      );
    });

    it('not_in operator', () => {
      const { flags, segments } = createFlagWithSegment([
        { field: 'country', operator: 'not_in', value: 'CN,RU,IR' },
      ]);

      evaluator.setConfiguration(createConfig(flags, segments));

      expect(evaluator.evaluate('test-flag', { country: 'US' }).enabled).toBe(
        true,
      );
      expect(evaluator.evaluate('test-flag', { country: 'CN' }).enabled).toBe(
        false,
      );
    });
  });

  describe('evaluateAll', () => {
    it('should evaluate all flags', () => {
      const flags: FlagDefinition[] = [
        {
          key: 'flag-a',
          valueType: 'boolean',
          defaultEnabled: true,
          defaultValue: true,
        },
        {
          key: 'flag-b',
          valueType: 'string',
          defaultEnabled: true,
          defaultValue: 'hello',
        },
        {
          key: 'flag-c',
          valueType: 'number',
          defaultEnabled: false,
          defaultValue: 42,
        },
      ];

      evaluator.setConfiguration(createConfig(flags));

      const results = evaluator.evaluateAll();

      expect(results).toHaveLength(3);
      expect(results.map((r) => r.flagKey).sort()).toEqual([
        'flag-a',
        'flag-b',
        'flag-c',
      ]);
    });
  });

  describe('getFlagKeys / hasFlag', () => {
    it('should return flag keys', () => {
      const flags: FlagDefinition[] = [
        { key: 'flag-a', valueType: 'boolean', defaultEnabled: true },
        { key: 'flag-b', valueType: 'string', defaultEnabled: true },
      ];

      evaluator.setConfiguration(createConfig(flags));

      expect(evaluator.getFlagKeys().sort()).toEqual(['flag-a', 'flag-b']);
    });

    it('should check if flag exists', () => {
      const flags: FlagDefinition[] = [
        { key: 'existing-flag', valueType: 'boolean', defaultEnabled: true },
      ];

      evaluator.setConfiguration(createConfig(flags));

      expect(evaluator.hasFlag('existing-flag')).toBe(true);
      expect(evaluator.hasFlag('non-existing-flag')).toBe(false);
    });
  });
});

describe('evaluateFlag function', () => {
  it('should evaluate a flag definition directly', () => {
    const flagDef: FlagDefinition = {
      key: 'direct-flag',
      valueType: 'boolean',
      defaultEnabled: true,
      defaultValue: true,
    };

    const segmentsMap = new Map<string, SegmentDefinition>();

    const result = evaluateFlag(flagDef, undefined, segmentsMap);

    expect(result.flag.flagKey).toBe('direct-flag');
    expect(result.flag.enabled).toBe(true);
    expect(result.flag.value).toBe(true);
  });
});
