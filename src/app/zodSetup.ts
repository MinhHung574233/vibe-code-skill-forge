import { z } from 'zod';

/**
 * Zod 4 probes `Function('')` to decide whether it may compile faster validators. Our
 * Content-Security-Policy forbids eval, so that probe is reported as a violation even though Zod
 * catches it and falls back. Setting jitless skips the probe: same behaviour, no violation, and
 * validation speed is irrelevant at our data sizes.
 */
z.config({ jitless: true });
