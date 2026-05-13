# PrestaShop fetch equivalents

This page shows how the Postman examples can be translated to `fetch` calls in a React app or any JavaScript project.

## Main idea

The `fetch` signature is:

```js
fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data)
});
```

For PrestaShop webservice calls, the same structure applies, but two details change often:

1. The API uses Basic Auth.
2. The body is frequently XML, not JSON.

## What each field means

- `url`: the endpoint to call, for example `http://localhost:8080/api/articles`.
- `method`: the HTTP verb. The most common ones are `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`.
- `headers`: metadata sent with the request, for example `Authorization`, `Content-Type`, and sometimes `Accept`.
- `body`: the payload sent to the server. It is only used for requests like `POST`, `PUT`, `PATCH`, and sometimes `DELETE`.

## Basic Auth for PrestaShop

The Postman collections use Basic Auth with the webservice key.

In `fetch`, you usually send the header manually:

```js
const headers = {
  Authorization: `Basic ${btoa(`${webserviceKey}:`)}`,
};
```

The colon at the end is important because the username is the webservice key and the password is empty.

## Example 1: GET all articles

Postman equivalent:

- URL: `{{webservice_url}}/api/articles`
- Method: `GET`

`fetch` equivalent:

```js
const response = await fetch(`${webserviceUrl}/api/articles`, {
  method: "GET",
  headers: {
    Authorization: `Basic ${btoa(`${webserviceKey}:`)}`,
  },
});
```

## Example 2: Create article with XML

Postman equivalent:

- URL: `{{webservice_url}}/api/articles`
- Method: `POST`
- Headers: `Content-Type: application/xml`
- Body: XML document

`fetch` equivalent:

```js
const body = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <article>
    <title>
      <language id="1"><![CDATA[My title in english]]></language>
      <language id="2"><![CDATA[Mon titre en français]]></language>
    </title>
    <type><![CDATA[Blog post]]></type>
  </article>
</prestashop>`;

const response = await fetch(`${webserviceUrl}/api/articles`, {
  method: "POST",
  headers: {
    Authorization: `Basic ${btoa(`${webserviceKey}:`)}`,
    "Content-Type": "application/xml",
  },
  body,
});
```

## Example 3: Update a product

For a full update, the method is usually `PUT`.

```js
const response = await fetch(`${webserviceUrl}/api/products/${productId}`, {
  method: "PUT",
  headers: {
    Authorization: `Basic ${btoa(`${webserviceKey}:`)}`,
    "Content-Type": "application/xml",
  },
  body: productXml,
});
```

For a partial update, the method is `PATCH`.

```js
const response = await fetch(`${webserviceUrl}/api/products/${productId}`, {
  method: "PATCH",
  headers: {
    Authorization: `Basic ${btoa(`${webserviceKey}:`)}`,
    "Content-Type": "application/xml",
  },
  body: partialXml,
});
```

## Example 4: Delete an article

```js
const response = await fetch(`${webserviceUrl}/api/articles/${articleId}`, {
  method: "DELETE",
  headers: {
    Authorization: `Basic ${btoa(`${webserviceKey}:`)}`,
    "Content-Type": "application/xml",
  },
  body: deleteXml,
});
```

## Example 5: Query parameters

Postman often uses query parameters such as:

- `?schema=blank`
- `?io_format=JSON`
- `?output_format=JSON`
- `?filter[id_product]=1&display=full`

In `fetch`, you can write them directly in the URL or use `URLSearchParams`.

```js
const params = new URLSearchParams({
  schema: "blank",
});

const response = await fetch(`${webserviceUrl}/api/products?${params.toString()}`, {
  method: "GET",
  headers: {
    Authorization: `Basic ${btoa(`${webserviceKey}:`)}`,
  },
});
```

## Example 6: JSON response

Some PrestaShop endpoints can return JSON when you add `io_format=JSON` or `output_format=JSON`.

```js
const response = await fetch(`${webserviceUrl}/api/articles/${articleId}?io_format=JSON`, {
  method: "GET",
  headers: {
    Authorization: `Basic ${btoa(`${webserviceKey}:`)}`,
    Accept: "application/json",
  },
});
```

## Example 7: Upload an image

The image upload endpoint uses `multipart/form-data`, not a raw JSON or XML body.

```js
const formData = new FormData();
formData.append("image", fileInput.files[0]);

const response = await fetch(`${webserviceUrl}/api/images/products/${productId}`, {
  method: "POST",
  headers: {
    Authorization: `Basic ${btoa(`${webserviceKey}:`)}`,
  },
  body: formData,
});
```

## Practical summary

- Use `GET` to read data.
- Use `POST` to create new resources.
- Use `PUT` to replace a resource.
- Use `PATCH` to update only part of a resource.
- Use `DELETE` to remove a resource.
- Add `Authorization: Basic ...` for PrestaShop webservices.
- Use `Content-Type: application/xml` when you send XML.

If you want, you can reuse these examples directly in a React service file, for example `src/services/prestashop.js`.