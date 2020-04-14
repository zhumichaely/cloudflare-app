addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Respond with one of two website variants based on a user request
 * @param {Request} request
 */
async function handleRequest(request) {
  let response = await fetch(
    "https://cfw-takehome.developers.workers.dev/api/variants"
  )
    .then((resp) => resp.json()) // keep response in json
    .then((obj) => obj.variants) // keep variants field
    .then(async function (arr) {
      const cookieName = "varNum";
      // check whether user has requested a variant in the current session
      cookie = getCookie(request, cookieName);
      // persist the variant they got before
      if (cookie) return await fetch(arr[Number(cookie) - 1]);
      else {
        // choose the variant and store in a cookie
        // proceed with variant 1 if the current millisecond is even, 2 if odd
        const variant = Date.now() % 2 == 0 ? 1 : 2;
        resp = await fetch(arr[variant - 1]);
        resp = new Response(resp.body, resp);
        resp.headers.set("Set-Cookie", cookieName + "=" + variant);
        return resp;
      }
    });
  // construct ElementHandlers for each customizable tag
  const changeTitle = new HTMLRewriter().on("title", new ElementHandler()),
    changeHead = new HTMLRewriter().on("h1#title", new ElementHandler()),
    changeDesc = new HTMLRewriter().on("p#description", new ElementHandler()),
    changeButton = new HTMLRewriter().on("a#url", new ElementHandler());
  // transform the html being served
  response = changeButton.transform(
    changeDesc.transform(changeHead.transform(changeTitle.transform(response)))
  );
  return response;
}

/**
 * Grabs the cookie with name from the request headers.
 * This method is from the Workers documentation
 * @param {Request} request incoming Request
 * @param {string} name of the cookie to grab
 */
function getCookie(request, name) {
  let result = null;
  let cookieString = request.headers.get("Cookie");
  if (cookieString) {
    let cookies = cookieString.split(";");
    cookies.forEach((cookie) => {
      let cookieName = cookie.split("=")[0].trim();
      if (cookieName === name) {
        let cookieVal = cookie.split("=")[1];
        result = cookieVal;
      }
    });
  }
  return result;
}

/*
 * ElementHandler implementation to modify variant pages
 */
class ElementHandler {
  constructor() {
    // initialize text variable to concatenate text chunks
    this.txt = "";
  }
  element(element) {
    if (element.tagName === "a") {
      // link to my GitHub profile
      element.setAttribute("href", "https://github.com/zhumichaely");
    }
  }
  text(text) {
    this.txt += text.text;
    text.remove();
    if (text.lastInTextNode) {
      this.txt = this.txt.trim(); // remove whitespace
      switch (
        this.txt // customize page with my own text
      ) {
        case "Variant 1":
          text.after("Zhu 1");
          break;
        case "Variant 2":
          text.after("Zhu 2");
          break;
        case "This is variant one of the take home project!":
          text.after(
            "Hello! My name is Michael Zhu. I hope you like purple because you're stuck with it now!"
          );
          break;
        case "This is variant two of the take home project!":
          text.after(
            "Hello! My name is Michael Zhu. I hope you like green because you're stuck with it now!"
          );
          break;
        case "Return to cloudflare.com":
          text.after("Click here for my GitHub");
      }
    }
  }
}
