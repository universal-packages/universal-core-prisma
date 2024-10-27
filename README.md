# Core Prisma

[![npm version](https://badge.fury.io/js/@universal-packages%2Fcore-prisma.svg)](https://www.npmjs.com/package/@universal-packages/core-prisma)
[![Testing](https://github.com/universal-packages/universal-core-prisma/actions/workflows/testing.yml/badge.svg)](https://github.com/universal-packages/universal-core-prisma/actions/workflows/testing.yml)
[![codecov](https://codecov.io/gh/universal-packages/universal-core-prisma/branch/main/graph/badge.svg?token=CXPJSN8IGL)](https://codecov.io/gh/universal-packages/universal-core-prisma)

[Prisma](https://prisma.dev/) universal-core abstraction.

## Install

```shell
npm install @universal-packages/core-prisma
```

## Initialization

This initialize the prisma schema using `prisma` as well as adapting the schema location to use the core abstraction.

```shell
ucore initialize prisma --datasource-provider postgresql
```

## Cli abstraction

Instead of running the normal prisma you now use the universal task.

```shell
ucore exec prisma generate
ucore exec prisma migrate dev
```

## Prisma Studio

YOu also now have access to a universal core app to run the studio

```shell
ucore run prisma-studio
```

## Prisma Global

Now prisma is available through the global module subject.

```ts
prismaSubject.user.findMany()
```

## Typescript

In order for typescript to see the global types you need to reference the types somewhere in your project, normally `./src/globals.d.ts`.

```ts
/// <reference types="@universal-packages/core-prisma" />
```

This library is developed in TypeScript and shipped fully typed.

## Contributing

The development of this library happens in the open on GitHub, and we are grateful to the community for contributing bugfixes and improvements. Read below to learn how you can take part in improving this library.

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Contributing Guide](./CONTRIBUTING.md)

### License

[MIT licensed](./LICENSE).
