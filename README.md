# verc
Verc allows you to automatically update your global .npmrc file with multiple registries.

## Usage
You can install verc globally and use it as a command line.

yarn
```
yarn global add verc
```

npm
```
npm -G install verc
```

Verc is friends with the `postinstall` lifecycle hook.
You can hook it into your projects to automatically update packages for you:

```json
{
  "name": "my-important-project",
  "scripts": {
    "postinstall": "verc update"
  }
}
```
