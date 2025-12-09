import audioop
import io
import wave
from contextlib import closing
from typing import Tuple

SUPPORTED_AUDIO_MIME_TYPES = {"audio/wav", "audio/x-wav", "audio/wave"}

def analyze_voice(audio_bytes: bytes, mime_type: str) -> Tuple[str, float, float, int]:
    normalized_mime = mime_type.lower().strip()
    if normalized_mime not in SUPPORTED_AUDIO_MIME_TYPES:
        raise ValueError(
            f"Unsupported audio MIME type: {mime_type}. Please provide a WAV file."
        )

    try:
        with closing(wave.open(io.BytesIO(audio_bytes), "rb")) as wav_file:
            sample_rate = wav_file.getframerate()
            sample_width = wav_file.getsampwidth()
            n_frames = wav_file.getnframes()
            duration_seconds = (
                float(n_frames) / float(sample_rate) if sample_rate > 0 else 0.0
            )
            raw_frames = wav_file.readframes(n_frames)
    except Exception as exc:
        raise ValueError("Unable to read WAV audio data") from exc

    rms_amplitude = (
        float(audioop.rms(raw_frames, sample_width)) if raw_frames else 0.0
    )
    summary = (
        "Voice analysis summary:\n"
        f"- Duration: {duration_seconds:.2f} seconds\n"
        f"- Sample rate: {sample_rate} Hz\n"
        f"- RMS loudness: {rms_amplitude:.2f}"
    )

    return summary, duration_seconds, rms_amplitude, sample_rate
