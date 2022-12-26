# Templates
## template-header.html
This template was created to become a stable version of the email standards used by the Digital Marketing team at Deriv. We strongly encourage you to keep this document as well as the files `template-header.html`, `0-list.html`, `footer-en.html`, ... up to date.
### Naming and ordering
- The area for `Outlook styles` comes first as they're a comment inside the `<head>`
- Inside the styles areas, the definition of html tags preceds the CSS classes/ elements.
- Media queries for size come next followed by media queries for dark/light modes and finally, [data-ogsc] elements.
- The CSS elements must be named with all relevant words separated by "-". The names must specify which element(s) will be impacted. Please, avoid generic names such as `.small-img` or `.new-paragraph`, try `.header-logo-low-width` or `#title-td`, `.paragraph-td`.
- The order of the elements must start with the most generic/external and end with the most specific/internal.
  - Ex. `* { ... }`, `body { ... }`, `ul { ... }`, `li { ... }`... `#ext-table { ... }`, `#ext-td { ... }`, `#int-table { ... }`, `#footer-table { ... }`, `#footer-links-td { ... }`. As shown, the html tags definition (`body`, `ul`, `li`) are ordered from the most generic to the most specific and they come before the classes/ ids defined (also ordered from the most generic to the most specific).
- The CSS properties must be ordered considering their impact they have on the layout. We suggest the box model first (`width`, `height`, `background-color`, `margin`, `padding` ...) then typography (`font-size`, `font-weight`, `line-height`, ...).
### Do's and Don'ts
 - Test changes before updating the template.
 - Check the previous styles (there are a few listed above in this manual) to see the best place to add your changes. Sometimes you just need to modify an existing style.
 - When you update a template, don't forget to update the related ones as well, e.g. all versions of the footer (EN, ID, TH, ...).
 - Avoid `!important` when it's not mandatory. If there are no style conflicts, it should not be applied.
 ### Basic styles
> - `#ext-table`: First element of the body. Sets the area of the email.
> - `#ext-td`: First tr of the `#ext-table`. This td has the internal table content. Defines the background color of the email.
> - `#int-table`/`#ol-int-table`: Defines the area that contains the email itself.
> - `#ol-int-td`: Defines the email area for Outlook.
> - `#h-logo-td`: td in hero where we add Deriv logo.
> - `#h-logo-black`/`#h-logo-white`: Define styles for both logos (light and dark modes).
> - `.h-img-td`: td where we add the header image of an email.
> - `.h-img-td input`: Styles for the header image.
> - `#title-td p`: Formatting the text of the title.
> - `.list-ul`: Applied to `0-list.html` to set up the td where it's included.
> - `#greeting-td p`/`#paragraph-td`: Generic styles for paragraphs in the email.
> - `.paragraph-td-discl p`: Styles for disclaimers used in EU versions of emails.
> - `.body-img`: Applied to `0-image1.html` and `0-image2.html` to set up the images included in the body of the email.
> - `0-table-inside-table.html` styles:
>   - `.columns-2-ext-td`: Defines the external td of the external table.
>   - `.columns-2-a`: Left td of the table where we usually insert an icon.
>   - `.columns-2-a img`: Styles for the icon.
>   - `.columns-2-b`: Right td of the table where we usually insert another table with 2 tr's.
>   - `.columns-2-b-title`: Contains the text of the upper tr of the internal table. Frequently used for subtitles.
>   - `.columns-2-b-text`: Contains the text of the lower tr of the internal table. Frequently used for descriptions.
>   - `.no-padding-td p`: Description paragraph.
> - `footer` styles:
>   - `#footer-table`: Second line of the `#ext-table`. Defines styles for the footer.
>   - `#footer-social-td`: Area where we include the social media image links.
>   - `#footer-links-td`: Area containing the utility links for the help centre, Security and privacy, etc.
>   - `#unsubscribe-p`: Defines styles for the unsubscribe paragraph as it has specific formatting.
>   - `#f-logo`: Defines styles for the gray logo in the footer.
### Mobile specific styles
> - `.mobile-hide`: Hides content when the client uses a mobile device.
> - `.mb-no-padding`: Remove 100% of the paddings of an element on mobile devices.
> - `.mb-visible-block`: Applied to the blocks that must be shown on mobile devices in opposition to `.mobile-hide`.
> - `.mb-title`: Defines styles for the `#title-td` on mobile devices.
### Dark mode specific styles
> - `.h-logo-white-div`: Styles for the header white logo used on dark mode.
> - `.hide-dark-h-logo`: Hides the dark logo on dark mode.
> - `.dark-black`: Applies black background for dark mode.
> - `.dark-gray`: Applies gray background for dark mode.
> - `.dark-subtext`: Converts the text to dark mode formatting.
### Mobile & dark mode specific styles
> - `.white-h-logo-low-width`: Decreases the size of the header white logo on dark mode.
> - `.dark-h-logo-low-width`: Decreases the size of the header black logo on dark mode.
