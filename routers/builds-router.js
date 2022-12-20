//requires
const express = require("express");
const router = express.Router();
const { Build } = require("../models/builds-model");

//pagination consts
const hasStartAndLimit = (start, limit) => !isNaN(start) && !isNaN(limit);
const numberOfPages = (total, start, limit) => Math.ceil(total / limit);
const currentPage = (total, start, limit) =>
  Math.floor((start - 1) / limit) + 1;
const lastPageItem = (total, start, limit) =>
  (numberOfPages(total, start, limit) - 1) * limit + 1;
const previousPageItem = (total, start, limit) =>
  start - limit > 0 ? start - limit : start;
const nextPageItem = (total, start, limit) =>
  start + limit < total ? start + limit : start;
const getFirstQueryString = (total, start, limit) =>
  hasStartAndLimit(start, limit) ? `?start=1&limit=${limit}` : "";
const getLastQueryString = (total, start, limit) =>
  hasStartAndLimit(start, limit)
    ? `?start=${lastPageItem(total, start, limit)}&limit=${limit}`
    : "";
const getPreviousQueryString = (total, start, limit) =>
  hasStartAndLimit(start, limit)
    ? `?start=${previousPageItem(total, start, limit)}&limit=${limit}`
    : "";
const getNextQueryString = (total, start, limit) =>
  hasStartAndLimit(start, limit)
    ? `?start=${nextPageItem(total, start, limit)}&limit=${limit}`
    : "";

//pagination
const createPagination = (total, start, limit, currentItems) => {
  const page = currentPage(total, start, limit);
  const pages = numberOfPages(total, start, limit);

  return {
    currentPage: page,
    currentItems,
    totalPages: pages,
    totalItems: total,
    _links: {
      first: {
        page: 1,
        href: `${process.env.BASE_URI}/builds/${getFirstQueryString(
          total,
          start,
          limit
        )}`,
      },
      last: {
        page: pages,
        href: `${process.env.BASE_URI}/builds/${getLastQueryString(
          total,
          start,
          limit
        )}`,
      },
      previous: {
        page: page - 1 <= 1 ? 1 : page - 1,
        href: `${process.env.BASE_URI}/builds/${getPreviousQueryString(
          total,
          start,
          limit
        )}`,
      },
      next: {
        page: page + 1 > pages ? page : page + 1,
        href: `${process.env.BASE_URI}/builds/${getNextQueryString(
          total,
          start,
          limit
        )}`,
      },
    },
  };
};

//collection route
router.get("/", async (req, res) => {
  if (req.header("Accept") !== "application/json") {
    res.sendStatus(406);
    return;
  }
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  try {
    const totalItems = await Build.countDocuments();

    const startInt = parseInt(req.query.start);
    const limitInt = parseInt(req.query.limit);
    console.log({ startInt, limitInt });

    const start = isNaN(startInt) || isNaN(limitInt) ? 1 : startInt;
    const limit = isNaN(limitInt) || isNaN(startInt) ? totalItems : limitInt;

    console.log({ start, limit });
    const builds = await Build.find()
      .skip(start - 1)
      .limit(limit);
    const buildsCollection = {
      items: builds,
      _links: {
        self: {
          href: `${process.env.BASE_URI}/builds`,
        },
        collection: {
          href: `${process.env.BASE_URI}/builds`,
        },
      },
      pagination: createPagination(
        totalItems,
        startInt,
        limitInt,
        builds.length
      ),
    };
    res.json(buildsCollection);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

//detail route
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const build = await Build.findById(id);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  if (build !== null) {
    res.json(build);
  } else {
    res.sendStatus(404);
  }
});
//checks if any flieds are empty
function emptyValueChecker(req, res, next) {
  if (req.body.title && req.body.theme && req.body.author && req.body.height) {
    next();
  } else {
    res.sendStatus(400);
  }
}

//post route
router.post("/", emptyValueChecker);

router.post("/", (req, res, next) => {
  const contentType = req.header("content-type");
  const allowedTypes = [
    "application/json",
    "application/x-www-form-urlencoded",
  ];

  if (allowedTypes.includes(contentType)) {
    next();
  } else {
    res.sendStatus(415);
  }
});
router.post("/", async (req, res) => {
  try {
    const build = new Build({
      title: req.body.title,
      theme: req.body.theme,
      date: new Date(),
      author: req.body.author,
      height: req.body.height,
    });
    await build.save();
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(500);
  }
});

//delete indiv route
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const findPage = await Build.findByIdAndDelete(id);
  if (findPage !== null) {
    res.sendStatus(204);
  } else {
    res.sendStatus(404);
  }
});

//edit indiv route
router.put("/:id", emptyValueChecker);

router.put("/:id", async (req, res) => {
  const id = req.params.id;
  await Build.findByIdAndUpdate(id, req.body);

  res.sendStatus(204);
});

//options route + CORS
router.options("/", (req, res) => {
  res.header("Allow", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.send();
});

router.options("/:id", (req, res) => {
  res.header("Allow", "GET, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  res.send();
});

module.exports = router;
