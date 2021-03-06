---
title: Errors
path: /advanced/errors
---

# Errors

## Automatic reporting

Any error that occurs during component rendering is logged to `console.error()`. Many frontend APM
tools such as [Datadog][datadog] and [Rollbar][rollbar] will automatically pick up on this, and log
accordingly.

## Manual reporting

If you’d like to handle errors yourself, reporting can be handled safely via the `manifold-error`
[custom event][custom-event]. This same custom event fires for all components:

```js
document.addEventListener('manifold-error', ({ detail }) => {
  console.log(detail);
  // {
  //   component: 'ManifoldPlanSelector',
  //   error: 'Something went wrong',
  // }

  // Report error message somewhere, or show something to the user…
});
```

## User display

We’ll automatically display the same error message to the user via a [toast][toast] if a component
fails to render.

[custom-event]:
  https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
[datadog]: https://www.datadoghq.com/
[rollbar]: https://rollbar.com/
[toast]: /components/toast
