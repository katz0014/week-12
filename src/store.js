import Vue from "vue";
import Vuex from "vuex";
import axiosAuth from "./axios-auth";
import router from "./router";
import axios from "axios";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    idToken: null,
    userId: null,
    error: "",
    user: null
  },
  mutations: {
    AUTH_USER(state, userData) {
      state.idToken = userData.token;
      state.userId = userData.userId;
    },
    SET_ERROR(state, errorMessage) {
      state.error = errorMessage;
    },
    EMPTY_ERROR(state) {
      state.error = "";
    },
    CLEAR_DATA(state) {
      state.idToken = null;
      state.userId = null;
    },
    STORE_USER(state, user) {
      state.user = user;
    }
  },
  actions: {
    signUp({ commit, dispatch }, authData) {
      axiosAuth
        .post("accounts:signUp?key=AIzaSyB_fq6FhY46xlQpURHzsDF17fR7Zm3n_Hg", {
          email: authData.email,
          password: authData.password,
          returnSecureToken: true
        })
        .then(res => {
          console.log(res);
          // Update the state
          commit("AUTH_USER", {
            token: res.data.idToken,
            userId: res.data.localId
          });
          // Local Storage
          const now = new Date();
          const expirationDate = new Date(
            now.getTime() + res.data.expiresIn * 1000
          );

          localStorage.setItem("token", res.data.idToken);
          localStorage.setItem("userId", res.data.localId);
          localStorage.setItem("expirationDate", expirationDate);
          localStorage.setItem("userEmail", authData.email);

          //dispatch an action and take care of putting user in database
          dispatch("storeUser", authData);

          router.push({
            name: "dashboard "
          });
        })
        .catch(error => {
          console.log(error.response.data.error.message);
          commit("SET_ERROR", error.response.data.error.message);
        });
    },
    signIn({ commit }, authData) {
      axiosAuth
        .post(
          "accounts:signInWithPassword?key=AIzaSyB_fq6FhY46xlQpURHzsDF17fR7Zm3n_Hg",
          {
            email: authData.email,
            password: authData.password,
            returnSecureToken: true
          }
        )
        .then(res => {
          console.log(res);
          commit("AUTH_USER", {
            token: res.data.idToken,
            userId: res.data.localId
          });
          // Local Storage
          const now = new Date();
          const expirationDate = new Date(
            now.getTime() + res.data.expiresIn * 1000
          );

          localStorage.setItem("token", res.data.idToken);
          localStorage.setItem("userId", res.data.localId);
          localStorage.setItem("expirationDate", expirationDate);
          localStorage.setItem("userEmail", authData.email);

          router.push({
            name: "dashboard "
          });
        })
        .catch(error => {
          console.log(error.response.data.error.message);
          commit("SET_ERROR", error.response.data.error.message);
        });
    },
    // closing SignIn
    clearError({ commit }) {
      commit("EMPTY_ERROR");
    },
    logout({ commit }) {
      localStorage.removeItem("token");
      localStorage.removeItem("expirationDate");
      localStorage.removeItem("userId");

      // commit mutation to clear the state
      commit("CLEAR_DATA");
      // send user to sign in route
      router.push({
        name: "signin "
      });
    },
    // getting information that we're saving in localStorage
    autoLogin({ commit }) {
      const token = localStorage.getItem("token");
      const expirationDate = localStorage.getItem("expirationDate");
      const userId = localStorage.getItem("userId");
      // give us date for current timestamp
      const now = new Date();
      // if the token has already expired
      if (now >= expirationDate) {
        return;
      } // else
      commit("AUTH_USER", {
        token: token,
        userId: userId
      });
    },
    storeUser({ state }, userData) {
      if (!state.idToken) {
        return;
      }
      // API call goes to database
      axios
        .post(
          "https://katz0014-week-12.firebaseio.com/users.json" +
            "?auth=" +
            state.idToken,
          userData
        )
        .then(res => console.log(res))
        .catch(error => console.log(error.message));
    },
    fetchUser({ commit, state }, userEmail) {
      if (!state.idToken) {
        return;
      }
      axios
        .get(
          "https://katz0014-week-12.firebaseio.com/users.json" +
            "?auth=" +
            state.idToken
        )
        .then(res => {
          const data = res.data;
          for (let key in data) {
            const user = data[key];
            if (user.email == userEmail) {
              console.log(user);
              user.id = key;
              commit("STORE_USER", user);
            }
          }
        });
    },
    updateUser({ state }) {
      axios
        .patch(
          "https://katz0014-week-12.firebaseio.com/users/" +
            state.user.id +
            ".json" +
            "?auth=" +
            state.idToken,
          {
            name: state.user.name
          }
        )
        .then(res => {
          console.log(res);
        })
        .catch(error => console.log(error.response));
    }
  },
  getters: {
    isAuthenticated(state) {
      return state.idToken !== null;
    },
    getUser(state) {
      return state.user;
    }
  }
});

// AIzaSyB_fq6FhY46xlQpURHzsDF17fR7Zm3n_Hg
