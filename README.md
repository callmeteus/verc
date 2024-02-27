# varc
Varc allows you to automatically update your global .npmrc file with multiple registries.

## Usage
You can install varc globally and use it as a command line.

yarn
```
yarn global add varc
```

npm
```
npm -G install varc
```

Varc is friends with the `postinstall` lifecycle hook.
You can hook it into your projects to automatically update packages for you:

```json
{
  "name": "my-important-project",
  "scripts": {
    "postinstall": "varc update"
  }
}
```