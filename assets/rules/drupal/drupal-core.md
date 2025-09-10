# Drupal 10 Core Rules

1. **Strict Types & PSR‑12**

   ```php
   declare(strict_types=1);
   ```

2. **Final Classes & Visibility**
   - Declare every class `final` unless you explicitly intend it to be extended.
   - Make all properties `private readonly` when possible; otherwise `private`.
   - Methods default to `private`; use `protected`/`public` only as needed.

3. **Dependency Injection**
   - Never call `\Drupal::service()` or `\Drupal::config()` in classes.
   - Use constructor injection with promoted properties:
     ```php
     public function __construct(
         private readonly ConfigFactoryInterface $config,
         private readonly LoggerChannelInterface $logger,
     ) {}
     ```

4. **Hook Implementations**
   - Thin wrapper: delegate to an invokable class with the `@Hook` attribute.
     See OOP hooks: https://api.drupal.org/api/drupal/core%21lib%21Drupal%21Core%21Hook%21Attribute%21Hook.php/class/Hook/11.x
   - Provide a `LegacyHook` bridge for procedural modules:
     https://www.drupal.org/node/3442349

5. **Service Definitions**

   ```yaml
   services:
     my_module.foo:
       class: Drupal\my_module\Foo
       arguments: ['@config.factory', '@logger.channel.my_module']
       tags: ['event_subscriber']
   ```

6. **Composer & Vendor**
   - Add third‑party libraries via `composer require`.
   - Never commit `vendor/`.

7. **Coding Standards & Checks**
   - 2‑space indent, 80–120 col soft limit.
   - Run `phpcbf --standard=Drupal,DrupalPractice` on staged files.

8. **Self‑Verification Checklist**
   - [ ] Class is `final` and marked `strict_types`.
   - [ ] All dependencies injected via constructor.
   - [ ] No static calls to `\Drupal::`.
   - [ ] Hooks use OOP attribute + LegacyHook.
   - [ ] Services listed in `<module>.services.yml`.
   - [ ] Visibility of properties/methods minimized.
