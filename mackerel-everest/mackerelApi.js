// Generated by CoffeeScript 1.6.3
(function() {
  var Credentials, Parse, Q, Types, atob, crypto, evernote, obj, promisify, store, _,
    _this = this;

  _ = require('lodash');

  promisify = require('when-promisify');

  Q = require('q');

  Q.longStackSupport = true;

  atob = require('atob');

  crypto = require('crypto');

  Parse = require('parse').Parse;

  Parse.initialize("RnNIA4148ExIhwBFNB9qMGci85tOOEBHbzwxenNY", "5FSg0xa311sim8Ok1Qeob7MLPGsz3wLFQexlOOgm");

  Credentials = Parse.Object.extend('Credentials');

  Types = require('./evernode').Types;

  store = {
    getCredentials: function(vendorId, username) {
      var q;
      if (!(vendorId && username)) {
        throw "null params for store query.";
      }
      q = new Parse.Query(Credentials);
      q.equalTo('vendorId', vendorId);
      q.equalTo('username', username);
      return q.find();
    },
    setCredentials: function(vendorId, username, credentials) {
      return new Credentials().save({
        vendorId: vendorId,
        username: username,
        credentials: credentials
      });
    }
  };

  evernote = null;

  module.exports = obj = {
    setup: function(app) {
      var handleOptions;
      evernote = app.evernote;
      app.store = store;
      app.all('/authentication/details', function(req, res) {
        var details;
        details = {};
        return obj.sendData(details, res);
      });
      handleOptions = function(req, res) {
        res.header("Access-Control-Allow-Headers", "Content-Type, x-username");
        return obj.sendData(null, res);
      };
      app.options('/mackerel/page', function(req, res) {
        return handleOptions(req, res);
      });
      app.options('/mackerel/stickers', function(req, res) {
        return handleOptions(req, res);
      });
      app.get('/mackerel/page', function(req, res) {
        var stub_page;
        stub_page = {
          url: 'http://stub-url',
          stickers: [
            {
              name: "stub-sticker-3"
            }
          ]
        };
        return obj.serveEvernoteRequest(req, res, function(userInfo) {
          var params;
          params = {
            url: req.query.url,
            title: req.query.title
          };
          return obj.fetchPages(userInfo, params).then(function(pages) {
            var page;
            page = pages[0];
            if (!page) {
              page = params;
              page.stickers = [];
            }
            return obj.sendData(page, res);
          });
        });
      });
      app.post('/mackerel/page', function(req, res) {
        return obj.serveEvernoteRequest(req, res, function(userInfo) {
          var thumbnail, thumbnailUrl;
          thumbnailUrl = req.body.thumbnailUrl;
          thumbnail = obj.urlToThumbnail(thumbnailUrl);
          return obj.savePage(userInfo, {
            title: req.body.title,
            tagGuids: req.body.stickers.map(function(e) {
              return e.id;
            }),
            url: req.body.url,
            thumbnailData: thumbnail.data,
            thumbnailMd5Hex: req.body.thumbnailMd5Hex,
            thumbnailDataB64: thumbnail.dataB64
          }).then(function(note) {
            obj.sendData({
              guid: note.guid
            }, res);
            return obj.mergeDuplicates(userInfo, {
              url: req.body.url
            });
          });
        });
      });
      app.get('/mackerel/stickers', function(req, res) {
        var stub_stickers;
        stub_stickers = [
          {
            id: 1,
            name: "stub-sticker-1"
          }, {
            id: 2,
            name: "stub-sticker-2"
          }, {
            id: 3,
            name: "stub-sticker-3"
          }, {
            id: 4,
            name: "##honeymoon"
          }, {
            id: 5,
            name: "##longnameherelsdkfjdklsj"
          }, {
            id: 6,
            name: "stub-sticker-6"
          }, {
            id: 7,
            name: "stub-sticker-7"
          }, {
            id: 8,
            name: "stub-sticker-8"
          }
        ];
        return obj.serveEvernoteRequest(req, res, function(userInfo) {
          return obj.fetchStickers(userInfo).then(function(stickers) {
            return obj.sendData(stickers, res);
          });
        });
      });
      app.post('/mackerel/stickers', function(req, res) {
        return obj.serveEvernoteRequest(req, res, function(userInfo) {
          return Q.fcall(function() {
            var id, name;
            name = req.body.name;
            id = req.body.id;
            if (id) {
              return obj.updateSticker(userInfo, {
                guid: id,
                name: name
              });
            } else {
              return obj.findSticker(userInfo, {
                name: name
              }).then(function(sticker) {
                if (sticker) {
                  return obj.updateSticker(userInfo, {
                    guid: sticker.guid,
                    name: name
                  });
                } else {
                  return obj.createSticker(userInfo, {
                    name: name
                  });
                }
              });
            }
          }).then(function(sticker) {
            var resultData;
            if (typeof sticker === 'object') {
              resultData = sticker;
            }
            return obj.sendData(resultData, res);
          });
        });
      });
      app.get('/mackerel/notes', function(req, res) {
        return obj.serveEvernoteRequest(req, res, function(userInfo) {
          var ascending, count, offset, sortOrder, url, words;
          url = req.query.url;
          words = "sourceURL:" + url;
          offset = 0;
          count = 10;
          sortOrder = 'UPDATED';
          ascending = false;
          return evernote.findNotes(userInfo, words, {
            offset: offset,
            count: count,
            sortOrder: sortOrder,
            ascending: ascending
          }, function(err, noteList) {
            if (err) {
              obj.sendError(res, err);
            } else {
              return obj.sendData(noteList, res);
            }
          });
        });
      });
      return console.log('mackerel api initialised.');
    },
    sendData: function(data, res) {
      res.header("Access-Control-Allow-Origin", "*");
      return res.send(data, 200);
    },
    sendError: function(res, err) {
      if (err === 'EDAMUserException') {
        return res.send(err, 403);
      }
      return res.send(err, 500);
    },
    fetchPages: function(userInfo, params) {
      var d;
      d = Q.defer();
      obj.findNotes(userInfo, {
        url: params.url
      }).then(function(notes) {
        var pages;
        pages = notes.map(function(note) {
          return {
            id: note.id,
            url: note.attributes.sourceURL,
            title: note.title,
            stickers: note.tagGuids.map(function(guid) {
              return {
                id: guid
              };
            })
          };
        });
        return d.resolve(pages);
      });
      return d.promise;
    },
    savePage: function(userInfo, params) {
      var d, data, linkToPage, md5, note, resource, thumbnail, thumbnailMd5Hex;
      d = Q.defer();
      linkToPage = "<a href='" + (encodeURI(params.url)) + "'>'" + params.title + "'</a>";
      thumbnail = new Buffer(params.thumbnailData);
      md5 = crypto.createHash('md5');
      md5.update(thumbnail);
      thumbnailMd5Hex = md5.digest('hex');
      data = new Types.Data();
      data.body = thumbnail;
      data.size = thumbnail.length;
      data.bodyHash = params.thumbnailDataB64;
      resource = new Types.Resource();
      resource.mime = 'image/jpeg';
      resource.data = data;
      note = {
        title: params.title,
        tagGuids: params.tagGuids,
        attributes: {
          sourceURL: params.url
        },
        content: "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">\n<en-note style=\"word-wrap: break-word; -webkit-nbsp-mode: space; -webkit-line-break: after-white-space;\">\n  <div>" + linkToPage + "</div>\n  <en-media type=\"image/jpeg\" hash=\"" + thumbnailMd5Hex + "\" width=\"100%\"/>\n  <div>Stickers: TODO links to stickers on this page</div>\n  <div>Date: " + (new Date()) + "</div>\n</en-note>",
        resources: [resource]
      };
      evernote.createNote(userInfo, note, function(err, note) {
        return d.resolve(note);
      });
      return d.promise;
    },
    fetchStickers: function(userInfo) {
      var deferred;
      deferred = Q.defer();
      evernote.listTags(userInfo, function(err, tags) {
        var sticker_prefix_pattern, stickers;
        if (err) {
          return deferred.reject(err);
        } else {
          sticker_prefix_pattern = /^##/;
          stickers = tags.filter(function(tag) {
            return tag.name.match(sticker_prefix_pattern);
          });
          return deferred.resolve(stickers.map(function(sticker) {
            return {
              id: sticker.guid,
              name: sticker.name
            };
          }));
        }
      });
      return deferred.promise;
    },
    findSticker: function(userInfo, params) {
      var d;
      d = Q.defer();
      obj.fetchStickers(userInfo).then(function(stickers) {
        var matches;
        matches = stickers.filter(function(sticker) {
          return sticker.name === params.name;
        });
        if (matches.length > 1) {
          throw "more than 1 match for " + params;
        }
        return d.resolve(matches[0]);
      });
      return d.promise;
    },
    createSticker: function(userInfo, params) {
      var d, tag;
      d = Q.defer();
      tag = {
        name: params.name
      };
      evernote.createTag(userInfo, tag, function(err, tag) {
        if (err) {
          throw err;
        }
        return d.resolve(tag);
      });
      return d.promise;
    },
    updateSticker: function(userInfo, params) {
      var d, tag;
      d = Q.defer();
      tag = {
        guid: params.guid,
        name: params.name
      };
      evernote.updateTag(userInfo, tag, function(err, tag) {
        if (err) {
          throw err;
        }
        return d.resolve(tag);
      });
      return d.promise;
    },
    mergeDuplicates: function(userInfo, params) {
      return Q.fcall(function() {
        if (params.notes) {
          return params.notes;
        } else {
          return obj.findNotes(userInfo, params);
        }
      }).then(function(notes) {
        var latestNote, loadFullNotes, orderedNotes, tagGuids;
        orderedNotes = _.sortBy(notes, function(e) {
          return e.updated;
        });
        latestNote = orderedNotes[0];
        tagGuids = latestNote.tagGuids;
        loadFullNotes = orderedNotes.map(function(e) {
          var d;
          d = Q.defer();
          evernote.getNote(userInfo, e.guid, {}, function(err, fullNote) {
            return d.resolve(fullNote);
          });
          return d.promise;
        });
        return Q.all(loadFullNotes).then(function(fullNotes) {
          var content, contentCollection, uniqueContents;
          console.log(fullNotes);
          contentCollection = fullNotes.map(function(e) {
            return e.content;
          });
          uniqueContents = _.uniq(contentCollection);
          if (uniqueContents.length === 1) {

          } else {
            console.log("TODO merge content");
            content = uniqueContents[0];
          }
          return _.rest(orderedNotes, latestNote).map(function(e) {
            return obj.deleteNote(e);
          });
        });
      });
    },
    serveEvernoteRequest: function(req, res, callback) {
      return obj.initEdamUser(req).then(callback).fail(function(e) {
        return console.error({
          msg: "error while serving evernote request",
          error: e,
          trace: e.stack
        });
      }).done();
    },
    initEdamUser: function(req) {
      var deferred, username;
      deferred = Q.defer();
      if (!req.session.user) {
        username = req.headers['x-username'];
        username || (username = req.query.username);
        store.getCredentials('evernote', username).then(function(credentialsSet) {
          var credentials, data;
          credentials = _.sortBy(credentialsSet, function(e) {
            return e.updatedAt;
          }).reverse()[0];
          return data = credentials.get('credentials');
        }).then(function(data) {
          var authToken, getUserPromise;
          authToken = data.authToken;
          getUserPromise = promisify(evernote, 'getUser');
          return getUserPromise(authToken);
        }).then(function(edamUser) {
          req.session.user = edamUser;
          return deferred.resolve(edamUser);
        });
      } else {
        deferred.resolve(req.session.user);
      }
      return deferred.promise;
    },
    findNotes: function(userInfo, params) {
      var ascending, count, d, offset, sortOrder, words;
      d = Q.defer();
      words = "sourceURL:" + params.url;
      offset = 0;
      count = 10;
      sortOrder = 'UPDATED';
      ascending = false;
      evernote.findNotes(userInfo, words, {
        offset: offset,
        count: count,
        sortOrder: sortOrder,
        ascending: ascending
      }, function(err, noteList) {
        if (err) {
          obj.sendError(res, err);
          return;
        } else {

        }
        return d.resolve(noteList.notes);
      });
      return d.promise;
    },
    deleteNote: function(note) {
      return console.log("TODO delete note " + note);
    },
    urlToThumbnail: function(thumbnailUrl) {
      var ab, data, e, i, ia, thumbnailData, thumbnailDataB64, _i, _len;
      thumbnailDataB64 = _(thumbnailUrl.split(',')).last();
      thumbnailData = atob(thumbnailDataB64);
      ab = new ArrayBuffer(thumbnailData.length);
      ia = new Uint8Array(ab);
      for (i = _i = 0, _len = thumbnailData.length; _i < _len; i = ++_i) {
        e = thumbnailData[i];
        ia[i] = thumbnailData.charCodeAt(i);
      }
      data = ia;
      return {
        data: data,
        dataB64: thumbnailDataB64
      };
    }
  };

}).call(this);
