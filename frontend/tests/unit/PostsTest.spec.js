import {mount, createLocalVue} from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import Posts from "../../src/components/Posts.vue";
import moment from "moment";

const localVue = createLocalVue();

localVue.use(Vuex);
localVue.use(VueRouter);

//Create dummy store
const store = new Vuex.Store({
    state: {
        user: {
            id: 1,
            firstname: 'test',
            lastname: 'test',
            email: 'test',
            avatar: 'test',
        }
    },
    getters: {
        user: (state) => state.user,
    }
});

//Create dummy routes
const routes = [
    {
        path: '/',
        name: 'posts',
    },
    {
        path: '/profiles',
        name: 'profiles'
    }
];

const router = new VueRouter({routes});

const mocktestData = [
    {
        id: 1,
        text: "I think it's going to rain",
        createTime: "2020-12-05 13:53:23",
        likes: 0,
        liked: false,
        media: {
            url: "test-image.jpg",
            type: "image"
        },
        author: {
            id: 2,
            firstname: "Gordon",
            lastname: "Freeman",
            avatar: 'avatar.url'
        }
    },
    {
        id: 2,
        text: "Which weighs more, a pound of feathers or a pound of bricks?",
        createTime: "2020-12-05 13:53:23",
        likes: 1,
        liked: true,
        media: null,
        author: {
            id: 3,
            firstname: "Sarah",
            lastname: "Connor",
            avatar: 'avatar.url'
        }
    },
    {
        id: 4,
        text: null,
        createTime: "2020-12-05 13:53:23",
        likes: 3,
        liked: false,
        media: {
            url: "test-video.mp4",
            type: "video"
        },
        author: {
            id: 5,
            firstname: "Richard",
            lastname: "Stallman",
            avatar: 'avatar.url'
        }
    }
];

//Mock axios.get method that our Component calls in mounted event
jest.mock("axios", () => ({
    get: () => Promise.resolve({
        data: mocktestData
    })
}));

describe('Posts', () => {
    console.log(mocktestData.length)
    const wrapper = mount(Posts, {router, store, localVue});

    it('as many posts as in testData', function () {
        const posts = wrapper.findAll('.post')
        expect(posts.length).toEqual(mocktestData.length)
    })

    it('correct rendering of image, video or none based on media property', function() {
        const posts = wrapper.findAll(".post")

        for (let i = 0; i < posts.length; i++) {
            let post = posts.at(i);
            let mediaType = mocktestData[i].media;
            if (mediaType!==null) {
                mediaType = mediaType.type
            }

            if (mediaType===null) {
                post = post.findAll('.post-image');
                expect(post.length).toEqual(0);
            }
            if (mediaType==='image') {
                expect(post.contains('.post-image') && !post.contains('video')).toBe(true)
            }
            if (mediaType==='video') {
                expect(post.contains('.post-image') && post.contains('video')).toBe(true)
            }
        }
    })

    it('time is displayed in correct format', function() {
        const posts = wrapper.findAll(".post")
        for (let i = 0; i < posts.length; i++) {
            let time = posts.at(i).find("div > span > small")
            expect(time.html()).toBe('<small>'+moment(mocktestData[i].createTime).format('LLLL')+'</small>')
        }
    })
});