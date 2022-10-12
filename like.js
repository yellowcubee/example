const router = require("express").Router();
const render = require("../lib/renderTemplate");
const uuid = require("uuid");
const path = require("path");

const { User, Pet, Breed, Like, Room } = require("../db/models");
const res = require("express/lib/response");





router.post('/', async (req, res) => {
    const user = req.session?.user;
    console.log(user);

    try {
        const result = [];

        const toMeLikes = await Like.findAll({ where: { to_user_id: user.id } });
        const fromMeLikes = await Like.findAll({ where: { user_id: user.id } });
        for (let i = 0; i < toMeLikes.length; i++) {
            for (let j = 0; j < fromMeLikes.length; j++) {
                if (toMeLikes[i].user_id === fromMeLikes[j].to_user_id && toMeLikes[i].to_user_id === fromMeLikes[j].user_id) {
                    // result.push(toMeLikes[i]);
                    result.push(fromMeLikes[j]);
                }
            }
        }

        const pets = [];

        for (let k = 0; k < result.length; k++) {
            const matchPet = await Pet.findOne({ where: { user_id: result[k].to_user_id }, include: [{ model: User}]  }, { raw: true });
            pets.push(matchPet);
        }

        console.log('pets123', pets);

        res.json(pets);
    } catch (err) {
        console.log(err);
    }
});

router.post('/create', async (req, res) => {
    const user = req.session?.user;
    const card = req.body; // питомец
    // console.log(card);

    try {
        const petUser = await User.findOne({ where: { id: card.user_id } }); // владелец питомца
        const checkLike = await Like.findOne({where: { user_id: user.id, to_user_id: petUser.id }});
        if (checkLike) {
            await Like.destroy({where: { user_id: user.id, to_user_id: petUser.id }});
            return res.json(user);
        }
        const like = await Like.create({ user_id: user.id, to_user_id: petUser.id });
        const opositeRoom = await Room.findOne({where: {firstLike: petUser.id, secondLike: user.id}})
        if(opositeRoom){
            await Room.create({firstLike: user.id, secondLike: petUser.id, name: opositeRoom.name})
            return res.json(opositeRoom)
        }
        const room = await Room.create({firstLike: user.id, secondLike: petUser.id, name: `${user.id}_${petUser.id}`})
        res.json(like);
    } catch (err) {
        console.log(err);
    }
})

router.post('/getroom', async(req, res) => {
    const {user_id, likedUser} = req.body;
    const room = await Room.findOne({where: {firstLike: user_id, secondLike: likedUser}})
    res.json(room)
})


module.exports = router;
