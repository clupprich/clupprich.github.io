
---
title: How a Postgres Sequence Replaced Redis Locks at 90M+ Units/Year
pubDate: 2026-01-11
slug: scaling-beyond-90m-units-anually
excerpt: "When Redis locks started deadlocking at scale, I found a simpler solution: let Postgres handle it. Here's how a database sequence eliminated our distributed locking issues and delivered sub-millisecond performance."
---

Imagine a warehouse processing over 90 million returned products every year. Each item needs a unique identifier - a "license plate" or LP - so it can be tracked through the returns process. Warehouse staff need these labels quickly: either pre-printed on rolls of stickers, or printed on-demand as items arrive.

When you're generating millions of unique identifiers, you need two things: speed and reliability. You can't accidentally give two items the same ID, and you can't make warehouse staff wait. Our initial solution worked, but it had a hidden weakness that would eventually cause problems at scale.

## The Original Approach: Redis Locks

Our system used a distributed lock in Redis to coordinate LP generation. Here's how it worked:

1. A warehouse worker requests a new LP (either for immediate printing or a batch)
2. The system grabs the Redis lock
3. It reads the last LP from the database, increments it (LP001 → LP002), and saves the new one
4. The system releases the lock so others can generate LPs
5. The LP is returned to the warehouse staff

Ruby made the incrementing logic really elegant with its `String#next` method:

```ruby
"LPAA0".next # => LPAA1
"LPAB9".next # => LPAC0
```

This architecture handled several million LPs per year. Until it started crumbling one day.

## The Problem: Deadlocks at Scale

Eventually, we started seeing deadlocks. Requests would pile up, waiting for the lock that never got released. Warehouse operations would grind to a halt. The usual culprit? A web request getting terminated mid-process, leaving the lock dangling.

The root issue was architectural: we had two systems (Redis for locking, Postgres for storage) that needed to stay synchronized. Every LP generation required network calls to both systems. More moving parts mean more failure modes.

## The Insight: Let the Database Handle It

I realized we were overcomplicating things. What if we could eliminate the external lock entirely and let Postgres handle coordination? Even better: what if we stopped storing every individual LP and just maintained a counter?

That's when I remembered Postgres sequences. A sequence is essentially a database-native counter designed for exactly this use case. Postgres handles all the coordination internally, making it both faster and more reliable than our distributed lock approach.

The performance? Under 1 millisecond for sequence operations. No network overhead, no lock management, no coordination headaches.

## The Solution: Postgres Sequences

The implementation is surprisingly simple. First, create a sequence:

```sql
CREATE SEQUENCE lp_sequence START WITH 1;
```

Then generate LPs by calling the `nextval` function:

```sql
SELECT 'LP' || LPAD(nextval('lp_sequence'), 3, '0');
```

This produces LPs like `LP001`, `LP002`, and so on. For more sophisticated formats with alphanumeric patterns (like our original `LPAA0` style), we added some Python logic to transform the numeric sequence value into the desired format.

## The Results

The impact was immediate:

- **No more deadlocks**: Postgres sequences are designed for high-concurrency access
- **Faster generation**: Sub-millisecond performance instead of multi-system coordination
- **Simpler architecture**: One system instead of two, fewer failure modes
- **Lower operational overhead**: No Redis cluster to maintain for this use case

Sometimes the best solution isn't adding more technology - it's recognizing that the tool you already have can solve the problem more elegantly.
