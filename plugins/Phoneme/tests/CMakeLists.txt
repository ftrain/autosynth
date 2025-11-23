# Tests for Phoneme formant synthesizer

include(FetchContent)
FetchContent_Declare(
    Catch2
    GIT_REPOSITORY https://github.com/catchorg/Catch2.git
    GIT_TAG v3.4.0
)
FetchContent_MakeAvailable(Catch2)

# Test executable
add_executable(PhonemeTests
    test_voice.cpp
    test_engine.cpp
)

target_include_directories(PhonemeTests PRIVATE
    ${CMAKE_SOURCE_DIR}/source
    ${CMAKE_SOURCE_DIR}/source/dsp
)

target_link_libraries(PhonemeTests PRIVATE
    Catch2::Catch2WithMain
    sst-libraries
)

# Register tests with CTest
include(CTest)
include(Catch)
catch_discover_tests(PhonemeTests)
