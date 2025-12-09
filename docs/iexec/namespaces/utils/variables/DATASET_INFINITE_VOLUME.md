[**iexec**](../../../../README.md)

***

[iexec](../../../../globals.md) / [utils](../README.md) / DATASET\_INFINITE\_VOLUME

# Variable: DATASET\_INFINITE\_VOLUME

> `const` **DATASET\_INFINITE\_VOLUME**: `number`

infinite dataset volume

A `Datasetorder` with this volume is considered as having an infinite volume and is eligible to be processed by any number of tasks without decrementing the remaining volume.
The Dataset owner still can cancel the order at any time.

NB: Infinite volume is represented by the maximum safe integer in JavaScript (`Number.MAX_SAFE_INTEGER`), which is `9007199254740991`.
