/**
 * Dependencies
 */
exports.processAudioTalk = function(io, audioData)
{
    //send audio to the relevant client
    io.to(audioData.locationCode).emit('audio', audioData);
};