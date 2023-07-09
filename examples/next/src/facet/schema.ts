import { enableMapSet, enablePatches } from "immer";

enableMapSet();
enablePatches();

type User = {
  id: string;
  email: string;
  name: string;
  accessCount?: number;

  emails: Set<string>;
  anotherNumber: number;

  comments: (
    | { type: "user"; body: string }
    | { type: "system"; count: number }
  )[];
};

function assertExists<T>(value: T | undefined | null): asserts value is T {
  console.log("<> attribute_exists", value);
  return;
}

function assertEqual<T, U extends T>(a: T, b: U): asserts a is U {
  console.log("<> equal", a, b);
  return;
}

(async () => {
  function run(forceUndefined = false) {
    function makeHandler<T extends {}>(
      path: (string | symbol)[],
    ): ProxyHandler<T> {
      return {
        get(target, p, receiver) {
          console.log("<-", [...path, p]);

          if (p === Symbol.toPrimitive) return () => 0;

          return new Proxy<User>(
            { path: [...path, p] } as any,
            makeHandler([...path, p]),
          );
        },

        set(target, p, newValue, receiver) {
          console.log("----->", [...path, p], newValue);
          return true;
        },
      };
    }

    const user = new Proxy<User>({} as any, makeHandler([]));

    assertEqual(user.comments[10]?.type, "system");
  }

  run();
})();
