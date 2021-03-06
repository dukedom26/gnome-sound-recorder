const GLib = imports.gi.GLib;
const Gst = imports.gi.Gst;
const GObject = imports.gi.GObject;
const GstPbutils = imports.gi.GstPbutils;


var Recording = new GObject.registerClass({  // eslint-disable-line no-unused-vars
    Properties: {
        'duration': GObject.ParamSpec.int(
            'duration',
            'Recording Duration', 'Recording duration in seconds',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXINT16, 0),

        'mime-type': GObject.ParamSpec.string(
            'mime-type',
            'Recording Audio Codec', 'Recording audio codec type',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
    },
}, class Recording extends GObject.Object {
    _init(file) {
        super._init({});
        this._file = file;

        this._name = file.get_basename();

        let info = file.query_info('time::created,time::modified', 0, null);

        let timeModified = info.get_attribute_uint64('time::modified');
        let timeCreated = info.get_attribute_uint64('time::created');
        this._timeModified = GLib.DateTime.new_from_unix_local(timeModified);
        this._timeCreated = GLib.DateTime.new_from_unix_local(timeCreated);

        var discoverer = new GstPbutils.Discoverer();
        discoverer.start();
        discoverer.connect('discovered', (_discoverer, audioInfo) => {
            this._duration = audioInfo.get_duration()  / Gst.SECOND;
            this.notify('duration');

            let stream = audioInfo.get_audio_streams()[0];
            if (stream) {
                this._mimeType = stream.get_caps().to_string().split(', ')[0];
                this.notify('mime-type');
            }
        });

        discoverer.discover_uri_async(this.uri);
    }

    get name() {
        return this._name;
    }

    get timeModified() {
        return this._timeModified;
    }

    get timeCreated() {
        return this._timeCreated;
    }

    get duration() {
        if (this._duration)
            return this._duration;
        else
            return undefined;
    }

    get mimeType() {
        return this._mimeType;
    }

    get file() {
        return this._file;
    }

    get uri() {
        return this._file.get_uri();
    }

    delete() {
        return this._file.trash_async(GLib.PRIORITY_DEFAULT, null, null);
    }

});
