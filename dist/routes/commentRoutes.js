"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const commentController_1 = require("../controllers/commentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/', commentController_1.getAllComments);
router.post('/', (req, _res, next) => {
    if (!req.headers.authorization) {
        req.user = undefined;
    }
    next();
}, commentController_1.createComment);
router.delete('/:id', authMiddleware_1.authenticateToken, commentController_1.deleteComment);
exports.default = router;
//# sourceMappingURL=commentRoutes.js.map