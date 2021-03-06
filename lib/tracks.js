Tracks = new Meteor.Collection('tracks');
Meteor.methods({
  'newTrack': function (roomId) {
    check(roomId, String);
    track = {
      roomId: roomId,
      instrument: INSTRUMENTS_808[0],
      volume: 50,
      muted: false
    };
    _.extend(track, beatsObj(16));
    trackId = Tracks.insert(track);
  },
  'removeTrack': function (trackId) {
    check(trackId, String);
    Tracks.remove(trackId);
  },
  'resetTrack': function (trackId) {
    check(trackId, String);
    // warning: may be slow?
    // get number of beats in the track
    track = Tracks.findOne(trackId);
    if (!track)
      throw new Meteor.Error('Track ID not found on resetTrack call');
    Tracks.update(trackId, { $set: beatsObj(numBeats(track)) }, false);
  },
  'increaseBeats': function (trackId) {
    check(trackId, String);
    track = Tracks.findOne(trackId);
    beats = numBeats(track);
    if (beats >= 32)
      throw new Meteor.Error('Cannot go over 32 beats in one track');
    updateFields = {};
    updateFields[beats] = false;
    return Tracks.update(trackId, { $set: updateFields }, false);
  },
  'decreaseBeats': function (trackId) {
    check(trackId, String);
    track = Tracks.findOne(trackId);
    beats = numBeats(track);
    if (beats <= 1)
      throw new Meteor.Error('Cannot decrease below 1 beat in a track');
    updateFields = {};
    updateFields[beats - 1] = '';
    return Tracks.update(trackId, { $unset: updateFields }, false);
  }
});
Tracks.allow({
  // only allow updates to beats, volume, instrument, and muted
  update: function (userId, doc, fieldNames, modifier) {
    allowedFields = _.map(_.range(numBeats(doc)), function (n) {
      return String(n);
    });
    allowedFields = _.union(allowedFields, [
      'volume',
      'instrument',
      'muted'
    ]);
    return _.difference(fieldNames, allowedFields).length === 0;
  }
});
// generate n empty beats
function beatsObj(N) {
  return _.object(_.map(_.range(N), function (n) {
    return [
      n,
      false
    ];
  }));
}
// returns the total number of beats, passed in a track obj
// {
//    0: true,
//    15: false 
// } --> returns 16
//
// {
//    0: true,
//    1: false
// } --> returns 2
numBeats = function (track) {
  // get the beats from the track object
  actualBeats = _.filter(_.keys(track), function (n) {
    return !isNaN(n);
  });
  //the track may be missing some, so the number of beats is the max beat found
  return Math.max.apply(null, actualBeats) + 1;
};